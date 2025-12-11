const express = require('express');
const router = express.Router();
const db = require("../../shared/db");

router.get('/routes/all', async (req, res) => {
  try {
    const sql = `
      SELECT 
        route.id,
        h1.id AS departure_harbor_id,
        h1.name AS departure_harbor,
        h1.country_iso3 AS departure_flag,
        h2.name AS destination_harbor,
        h2.country_iso3 AS destination_flag,
        route.departure_time,
        route.arrival_time,
        ship.name AS shipname,
        route.price
      FROM route
      JOIN ship ON ship.id = route.ship
      JOIN harbor h1 ON h1.id = route.departure_harbor
      JOIN harbor h2 ON h2.id = route.destination_harbor
    `;

    const [rows] = await db.query(sql);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching all routes:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/routes/:harborId', async (req, res) => {
  const { harborId } = req.params;

  try {
    const sql = `
      SELECT 
        route.id,
        h1.id AS departure_harbor_id,
        h1.name AS departure_harbor,
        h1.country_iso3 AS departure_flag,
        h2.name AS destination_harbor,
        h2.country_iso3 AS destination_flag,
        route.departure_time,
        route.arrival_time,
        ship.name AS shipname,
        route.price
      FROM route
      JOIN ship ON ship.id = route.ship
      JOIN harbor h1 ON h1.id = route.departure_harbor
      JOIN harbor h2 ON h2.id = route.destination_harbor
      WHERE h1.id = ?
    `;

    const [rows] = await db.query(sql, [harborId]);
    res.json(rows);

  } catch (err) {
    console.error(`Error fetching routes for harbor ID ${harborId}:`, err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/routes/container/:containerId', async (req, res) => {
  const { containerId } = req.params;

  try {
    const sql = `
      SELECT 
        route.id,
        h1.id AS departure_harbor_id,
        h1.name AS departure_harbor,
        h1.country_iso3 AS departure_flag,
        h2.name AS destination_harbor,
        h2.country_iso3 AS destination_flag,
        route.departure_time,
        route.arrival_time,
        ship.name AS shipname,
        route.price
      FROM reservation_container rc
      JOIN reservation r ON rc.reservation_id = r.id
      JOIN route ON r.route_id = route.id
      JOIN ship ON ship.id = route.ship
      JOIN harbor h1 ON h1.id = route.departure_harbor
      JOIN harbor h2 ON h2.id = route.destination_harbor
      WHERE rc.container_id = ?
    `;

    const [rows] = await db.query(sql, [containerId]);
    res.json(rows);

  } catch (err) {
    console.error(`Error fetching routes for container ID ${containerId}:`, err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;