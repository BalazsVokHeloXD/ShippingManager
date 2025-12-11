const express = require('express');
const router = express.Router();
const db = require("../../shared/db");

router.get('/containers/all', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        c.id, 
        c.name, 
        ct.type, 
        ct.price, 
        c.size, 
        h.name AS harbor_name, 
        h.id AS harbor_id
      FROM container c
      JOIN container_type ct ON c.type_id = ct.id
      JOIN harbor h ON c.harbor_id = h.id
    `);

    res.json(rows);
  } catch (err) {
    console.error('Error fetching all containers:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;