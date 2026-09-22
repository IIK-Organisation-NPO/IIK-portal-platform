// backend/routes/blogRoutes.js
const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

/* ================================================================
   Helper: detect whether a stored HTML body contains an <img>
   (used to enrich the API response — no DB change needed)
================================================================ */
const hasEmbeddedImage = (html) => /<img\s[^>]*src=/i.test(html || '');

/* ================================================================
   GET /api/blog?tab=All&search=foo
   Returns posts (content included, so the public page can render
   the embedded featured image).
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
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

/* ================================================================
   GET /api/blog/:id
================================================================ */
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT BlogPost_id AS id, Title AS title, Type AS type,
              Content AS content, Status AS status, Tags AS tags,
              EventDate AS eventDate, Venue AS venue, DatePublished
       FROM BlogPosts WHERE BlogPost_id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('[GET /api/blog/:id]', err);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

/* ================================================================
   PUT /api/blog/:id
================================================================ */
router.put('/:id', async (req, res) => {
  const { title, type, status, date, author } = req.body;

  try {
    let adminId = null;
    if (author) {
      const [rows] = await pool.query(
        'SELECT Admin_ID FROM Admin WHERE Name = ? LIMIT 1',
        [author]
      );
      if (rows.length) adminId = rows[0].Admin_ID;
    }

    const parsedDate  = date ? new Date(date) : null;
    const isPublished = status === 'Published';

    await pool.query(
      `UPDATE BlogPosts
         SET Title         = ?,
             Type          = ?,
             Status        = ?,
             DatePublished = ?,
             Admin_id      = COALESCE(?, Admin_id)
       WHERE BlogPost_id = ?`,
      [title, type, status, isPublished ? parsedDate : null, adminId, req.params.id]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error('[PUT /api/blog/:id]', err);
    res.status(500).json({ error: 'Failed to update post' });
  }
});

/* ================================================================
   DELETE /api/blog/:id
================================================================ */
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM BlogPosts WHERE BlogPost_id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error('[DELETE /api/blog/:id]', err);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

/* ================================================================
   POST /api/blog
   The featured image is already embedded as an <img> tag inside
   `articleBody` by the frontend, so it lands safely in `Content`.
================================================================ */
router.post('/', async (req, res) => {
  const {
    postType, officialTitle, tags, articleBody,
    eventDate, venue, status,
  } = req.body;

  // Try several common session key shapes, fall back to 1
  const adminId =
    req.session?.adminId ||
    req.session?.admin?.Admin_ID ||
    req.session?.user?.Admin_ID ||
    req.session?.user?.id ||
    1;

  // Soft dev-time check — warn if body has no image, but still save.
  if (process.env.NODE_ENV !== 'production' && !hasEmbeddedImage(articleBody)) {
    console.warn(
      `[POST /api/blog] Post "${officialTitle}" has no embedded image in Content.`
    );
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO BlogPosts
         (Admin_id, Title, Content, Type, Tags, EventDate, Venue, Status, DatePublished)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        adminId,
        officialTitle,
        articleBody,
        postType,
        tags || null,
        eventDate || null,
        venue || null,
        status === 'published' ? 'Published' : 'Draft',
        status === 'published' ? new Date() : null,
      ]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    console.error('[POST /api/blog]', err);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

module.exports = router;