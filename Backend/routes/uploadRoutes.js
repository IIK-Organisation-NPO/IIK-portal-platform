// backend/routes/uploadRoutes.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();

// Keep the uploaded file in memory — nothing is written to disk
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpe?g|png|gif|webp)$/.test(file.mimetype)) return cb(null, true);
    cb(new Error('Only JPG, PNG, GIF, WEBP images are allowed'));
  },
});

// POST /api/upload/blog  — field name: "image"
// Returns the image as a base64 data URL — the frontend embeds it inline.
router.post('/blog', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const base64 = req.file.buffer.toString('base64');
    const url = `data:${req.file.mimetype};base64,${base64}`;

    res.status(201).json({
      success: true,
      url,
      mime: req.file.mimetype,
      size: req.file.size,
    });
  } catch (err) {
    console.error('Blog image upload error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;