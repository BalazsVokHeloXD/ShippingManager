const express = require('express');
const router = express.Router();
const db = require("../../shared/db");

router.get('/countries', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT name, iso3 FROM country ORDER BY name ASC');
    res.json(rows);
  } catch (err) {
    console.error('Failed to fetch countries:', err);
    res.status(500).json({ error: 'Failed to fetch countries' });
  }
});

module.exports = router;