const express = require('express');
const router = express.Router();
const db = require("../../shared/db"); 

router.get("/containers", async (req, res) => {
  const { harbor_id } = req.query;

  if (!harbor_id) {
    return res.status(400).json({ message: "Missing harbor_id in query" });
  }

  try {
    const [rows] = await db.query(
      `
      SELECT c.id, c.name, ct.type, ct.price, c.size, h.name AS harbor_name
      FROM container c
      JOIN harbor h ON h.id = c.harbor_id
      JOIN container_type ct ON c.type_id = ct.id
      LEFT JOIN (
          SELECT t.container_id, t.arrivaltime
          FROM (
              SELECT rc.container_id, ro.arrival_time AS arrivaltime,
                    ROW_NUMBER() OVER (PARTITION BY rc.container_id ORDER BY rc.id DESC) AS rn
              FROM reservation_container rc
              JOIN reservation r ON rc.reservation_id = r.id
              JOIN route ro ON r.route_id = ro.id
          ) t
          WHERE t.rn = 1
      ) last_res ON last_res.container_id = c.id
      WHERE c.harbor_id = ?
        AND (last_res.container_id IS NULL OR last_res.arrivaltime <= NOW());
      `,
      [harbor_id]
    );

    res.json(rows);
  } catch (err) {
    console.error("Error fetching containers:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/container-types", async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT id, type FROM container_type");
    res.json(rows);
  } catch (err) {
    console.error("Error fetching container types:", err);
    res.status(500).json({ error: "Failed to fetch container types" });
  }
});

router.post("/containers/by-ids", async (req, res) => {
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ message: "Invalid or missing container IDs" });
  }

  try {
    const placeholders = ids.map(() => "?").join(",");
    const [rows] = await db.query(
      `
      SELECT container.id, container.name, ct.type, ct.price, container.size
      FROM container
      JOIN container_type ct ON container.type_id = ct.id
      WHERE container.id IN (${placeholders})
      `,
      ids
    );

    res.json(rows);
  } catch (err) {
    console.error("Error fetching containers by IDs:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;