// backend/routes/blogRoutes.js
const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { authenticate, isAdmin } = require('../middleware/auth');

/* ================================================================
   Helper: detect whether a stored HTML body contains an <img>
================================================================ */
const hasEmbeddedImage = (html) => /<img\s[^>]*src=/i.test(html || '');

/* ================================================================
   Helper: extract the FIRST embedded image from an HTML body.
   Returns { buffer, mime } or null.
================================================================ */
const extractFirstImage = (html) => {
  if (!html) return null;
  const match = /<img[^>]+src=["']data:(image\/[a-zA-Z0-9+.-]+);base64,([^"']+)["']/i.exec(html);
  if (!match) return null;

  const mime = match[1];
  const base64 = match[2];

  try {
    return {
      mime,
      buffer: Buffer.from(base64, 'base64'),
    };
  } catch (err) {
    console.error('Failed to decode embedded image base64:', err.message);
    return null;
  }
};

/* ================================================================
   Helper: resolve the logged-in admin's id from the JWT.
================================================================ */
const resolveAdminId = (req) =>
  req.user?.userId ??
  req.user?.Admin_ID ??
  req.user?.adminId ??
  req.user?.id ??
  null;

/* ================================================================
   DEBUG: log every request
================================================================ */
router.use((req, res, next) => {
  console.log(
    `${req.method} ${req.originalUrl} - Auth header:`,
    req.headers.authorization ? 'present' : 'missing'
  );
  next();
});

/* ================================================================
   GET /api/blog?tab=All&search=foo  (PUBLIC)
================================================================ */
router.get('/', async (req, res) => {
  try {
    const { tab, search } = req.query;

    let sql = `
      SELECT bp.BlogPost_id  AS id,
             bp.Title        AS title,
             bp.Type         AS type,
             bp.Content      AS content,
             a.Name          AS author,
             bp.Status       AS status,
             COALESCE(bp.DatePublished, bp.DateCreated) AS rawDate
      FROM BlogPosts bp
      JOIN Admin a ON a.Admin_ID = bp.Admin_id
      WHERE 1 = 1
    `;
    const params = [];

    if (tab === 'Blog Posts')  { sql += ' AND bp.Type = ?';   params.push('Blog Post'); }
    else if (tab === 'News')   { sql += ' AND bp.Type = ?';   params.push('News'); }
    else if (tab === 'Events') { sql += ' AND bp.Type = ?';   params.push('Event'); }
    else if (tab === 'Drafts') { sql += ' AND bp.Status = ?'; params.push('Draft'); }
    else                       { sql += " AND bp.Status != 'Draft'"; }

    if (search) {
      sql += ' AND (bp.Title LIKE ? OR a.Name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY bp.DateCreated DESC';

    const [rows] = await pool.query(sql, params);

    const posts = rows.map((r) => ({
      id:        r.id,
      title:     r.title,
      type:      r.type,
      author:    r.author,
      status:    r.status,
      content:   r.content,
      hasImage:  hasEmbeddedImage(r.content),
      date:      r.rawDate
        ? new Date(r.rawDate).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
          })
        : '',
    }));

    res.json(posts);
  } catch (err) {
    console.error('[GET /api/blog]', err);
    res.status(500).json({
      error: 'We could not load the blog posts right now. Please try again in a moment.'
    });
  }
});

/* ================================================================
   GET /api/blog/:id/image  (PUBLIC)
================================================================ */
router.get('/:id/image', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT cover_image_data, cover_image_mime
       FROM BlogPosts WHERE BlogPost_id = ?`,
      [req.params.id]
    );

    if (!rows.length || !rows[0].cover_image_data) {
      return res.status(404).json({ error: 'No image for this post.' });
    }

    const mime = rows[0].cover_image_mime || 'image/png';
    const buffer = Buffer.isBuffer(rows[0].cover_image_data)
      ? rows[0].cover_image_data
      : Buffer.from(rows[0].cover_image_data);

    res.setHeader('Content-Type', mime);
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.end(buffer);
  } catch (err) {
    console.error('[GET /api/blog/:id/image]', err);
    res.status(500).json({
      error: 'We could not load this image right now. Please try again in a moment.'
    });
  }
});

/* ================================================================
   GET /api/blog/:id  (PUBLIC)
================================================================ */
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT BlogPost_id AS id, Title AS title, Type AS type,
              Content AS content, Status AS status, Tags AS tags,
              EventDate AS eventDate, Venue AS venue, DatePublished,
              CASE WHEN cover_image_data IS NOT NULL THEN 1 ELSE 0 END AS hasCoverImage
       FROM BlogPosts WHERE BlogPost_id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Post not found.' });
    res.json(rows[0]);
  } catch (err) {
    console.error('[GET /api/blog/:id]', err);
    res.status(500).json({
      error: 'We could not load this post right now. Please try again in a moment.'
    });
  }
});

/* ================================================================
   PUT /api/blog/:id  (ADMIN ONLY)
================================================================ */
router.put('/:id', authenticate, isAdmin, async (req, res) => {
  const { title, type, status, date, articleBody } = req.body;

  try {
    const parsedDate  = date ? new Date(date) : null;
    const isPublished = status === 'Published';

    const extracted = articleBody ? extractFirstImage(articleBody) : null;

    if (articleBody !== undefined && extracted) {
      await pool.query(
        `UPDATE BlogPosts
           SET Title             = ?,
               Type              = ?,
               Status            = ?,
               DatePublished     = ?,
               Content           = ?,
               cover_image_data  = ?,
               cover_image_mime  = ?
         WHERE BlogPost_id = ?`,
        [
          title, type, status, isPublished ? parsedDate : null,
          articleBody, extracted.buffer, extracted.mime,
          req.params.id,
        ]
      );
    } else if (articleBody !== undefined) {
      await pool.query(
        `UPDATE BlogPosts
           SET Title             = ?,
               Type              = ?,
               Status            = ?,
               DatePublished     = ?,
               Content           = ?,
               cover_image_data  = NULL,
               cover_image_mime  = NULL
         WHERE BlogPost_id = ?`,
        [title, type, status, isPublished ? parsedDate : null, articleBody, req.params.id]
      );
    } else {
      await pool.query(
        `UPDATE BlogPosts
           SET Title         = ?,
               Type          = ?,
               Status        = ?,
               DatePublished = ?
         WHERE BlogPost_id = ?`,
        [title, type, status, isPublished ? parsedDate : null, req.params.id]
      );
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('[PUT /api/blog/:id]', err);
    res.status(500).json({
      error: 'We could not update this post right now. Please try again in a moment.'
    });
  }
});

/* ================================================================
   DELETE /api/blog/:id  (ADMIN ONLY)
================================================================ */
router.delete('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM BlogPosts WHERE BlogPost_id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error('[DELETE /api/blog/:id]', err);
    res.status(500).json({
      error: 'We could not delete this post right now. Please try again in a moment.'
    });
  }
});

/* ================================================================
   POST /api/blog  (ADMIN ONLY)
================================================================ */
router.post('/', authenticate, isAdmin, async (req, res) => {
  const {
    postType, officialTitle, tags, articleBody,
    eventDate, venue, status,
  } = req.body;

  const adminId = resolveAdminId(req);

  if (!adminId) {
    console.warn('[POST /api/blog] Rejected — no admin id on req.user:', req.user);
    return res.status(401).json({ error: 'Please log in again to continue.' });
  }

  // ---- Friendly input validation ----
  if (!officialTitle || !officialTitle.trim()) {
    return res.status(400).json({ error: 'Please enter a title for this post.' });
  }

  if (!postType) {
    return res.status(400).json({ error: 'Please choose a post type.' });
  }

  const extracted = extractFirstImage(articleBody);

  if (process.env.NODE_ENV !== 'production' && !hasEmbeddedImage(articleBody)) {
    console.warn(
      `[POST /api/blog] Post "${officialTitle}" has no embedded image in Content.`
    );
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO BlogPosts
         (Admin_id, Title, Content, cover_image_data, cover_image_mime,
          Type, Tags, EventDate, Venue, Status, DatePublished)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        adminId,
        officialTitle.trim(),
        articleBody,
        extracted ? extracted.buffer : null,
        extracted ? extracted.mime : null,
        postType,
        tags || null,
        eventDate || null,
        venue || null,
        status === 'published' ? 'Published' : 'Draft',
        status === 'published' ? new Date() : null,
      ]
    );

    res.status(201).json({
      id: result.insertId,
      hasCoverImage: !!extracted,
    });
  } catch (err) {
    console.error('[POST /api/blog]', err);

    
    if (err.code === 'ER_DATA_TOO_LONG') {
      return res.status(400).json({
        error: 'This post is too large to save. Try using a smaller image.'
      });
    }
    if (err.code === 'ER_NET_PACKET_TOO_LARGE') {
      return res.status(413).json({
        error: 'This post contains too much data. Try a smaller image.'
      });
    }

    res.status(500).json({
      error: 'We could not publish this post right now. Please try again in a moment.'
    });
  }
});

module.exports = router;