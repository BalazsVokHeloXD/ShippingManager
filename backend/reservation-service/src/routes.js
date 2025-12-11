const express = require('express');
const router = express.Router();
const db = require("../../shared/db");

router.get("/routes", async (req, res) => {
  const {
    depContinent,
    depCountry,
    depHarbor,
    arrContinent,
    arrCountry,
    arrHarbor
  } = req.query;

  try {
    let sql = `
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
      JOIN country c1 ON c1.iso3 = h1.country_iso3
      JOIN harbor h2 ON h2.id = route.destination_harbor
      JOIN country c2 ON c2.iso3 = h2.country_iso3
      WHERE route.departure_time > NOW()
    `;

    const params = [];

    if (depContinent) {
      sql += " AND c1.continent_code = ?";
      params.push(depContinent);
    }
    if (depCountry) {
      sql += " AND h1.country_iso3 = ?";
      params.push(depCountry);
    }
    if (depHarbor) {
      sql += " AND h1.name = ?";
      params.push(depHarbor);
    }
    if (arrContinent) {
      sql += " AND c2.continent_code = ?";
      params.push(arrContinent);
    }
    if (arrCountry) {
      sql += " AND h2.country_iso3 = ?";
      params.push(arrCountry);
    }
    if (arrHarbor) {
      sql += " AND h2.name = ?";
      params.push(arrHarbor);
    }

    const [rows] = await db.query(sql, params);
    res.json(rows);

  } catch (err) {
    console.error("Error fetching filtered routes:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/filters", async (req, res) => {
  try {
    const [continentRows] = await db.query(`SELECT * FROM continent`);
    const [countryRows] = await db.query(`SELECT DISTINCT c.iso3, c.name AS "country_name", c.continent_code FROM country c JOIN harbor h ON h.country_iso3 = c.iso3 ORDER BY c.NAME`);
    const [harborRows] = await db.query(`SELECT * FROM harbor`);

    res.json({
      continents: continentRows.map(r => ({ code: r.code, name: r.name })),
      countries: countryRows.map(r => ({
        name: r.country_name,
        continent: r.continent_code,
        iso3: r.iso3
      })),
      harbors: harborRows.map(r => ({
        id: r.id,
        country_iso3: r.country_iso3,
        name: r.name
      })),
    });
  } catch (err) {
    console.error("Error fetching filters:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;