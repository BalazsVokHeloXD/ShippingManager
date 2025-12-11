const express = require('express');
const router = express.Router();
const db = require("../../shared/db");

router.get('/harbors', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        h.id, 
        h.name, 
        h.country_iso3, 
        c.name AS country_name, 
        COUNT(co.id) AS containerNumber
      FROM harbor h
      JOIN country c ON h.country_iso3 = c.iso3
      LEFT JOIN container co ON co.harbor_id = h.id
      GROUP BY h.id, h.name, h.country_iso3, c.name
    `);

    res.json(rows);
  } catch (err) {
    console.error('Error fetching harbors:', err);
    res.status(500).json({ message: 'Failed to fetch harbors' });
  }
});

router.post('/harbor', async (req, res) => {
  const { name, country_iso3 } = req.body;

  if (!name || !country_iso3) {
    return res.status(400).json({ message: 'Name and country_iso3 are required' });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO harbor (name, country_iso3) VALUES (?, ?)',
      [name, country_iso3]
    );

    const [rows] = await db.query(
      `SELECT 
        h.id, 
        h.name, 
        h.country_iso3, 
        c.name AS country_name, 
        0 AS containerNumber
      FROM harbor h
      JOIN country c ON h.country_iso3 = c.iso3
      WHERE h.id = ?`,
      [result.insertId]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Error creating harbor:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Harbor name already exists' });
    }
    res.status(500).json({ message: 'Failed to create harbor' });
  }
});

router.put('/harbor/:id', async (req, res) => {
  const { id } = req.params;
  const { name, country_iso3 } = req.body;

  if (!name || !country_iso3) {
    return res.status(400).json({ message: 'Name and country_iso3 are required' });
  }

  try {
    const [result] = await db.query(
      'UPDATE harbor SET name = ?, country_iso3 = ? WHERE id = ?',
      [name, country_iso3, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Harbor not found' });
    }

    const [rows] = await db.query(
      `SELECT 
         h.id, 
         h.name, 
         h.country_iso3, 
         c.name AS country_name, 
         COUNT(co.id) AS containerNumber
       FROM harbor h
       JOIN country c ON h.country_iso3 = c.iso3
       LEFT JOIN container co ON co.harbor_id = h.id
       WHERE h.id = ?
       GROUP BY h.id, h.name, h.country_iso3, c.name`,
      [id]
    );

    res.json(rows[0]);
  } catch (err) {
    console.error('Error updating harbor:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Harbor name already exists' });
    }
    res.status(500).json({ message: 'Failed to update harbor' });
  }
});

module.exports = router;