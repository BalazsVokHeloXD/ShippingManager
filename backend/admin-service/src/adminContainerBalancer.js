const express = require('express');
const router = express.Router();
const db = require("../../shared/db");

router.get("/total-containers", async (req, res) => {
  try {
    const [rows] = await db.query(`SELECT COUNT(*) AS total_count FROM container`);
    const total = rows[0]?.total_count || 0;
    res.json({ total_count: total });
  } catch (err) {
    console.error("Error fetching total containers:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/harbor-targets", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
          h.id AS harbor_id,
          h.name AS harbor_name,
          h.target_container_amount,
          COALESCE(c.current_count, 0) AS current_container_count,
          co.name AS country_name,
          co.iso3 AS country_iso3,
          cn.code AS continent_code
      FROM harbor h
      LEFT JOIN (
          SELECT harbor_id, COUNT(*) AS current_count
          FROM container
          GROUP BY harbor_id
      ) c ON c.harbor_id = h.id
      LEFT JOIN country co ON h.country_iso3 = co.iso3
      LEFT JOIN continent cn ON co.continent_code = cn.code
      ORDER BY h.id;
    `);

    res.json(rows);
  } catch (err) {
    console.error("Error fetching harbor targets:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/harbor-targets", async (req, res) => {
  const { harbor_id, desired_count } = req.body;

  if (!harbor_id || desired_count == null || desired_count < 0) {
    return res.status(400).json({ message: "Invalid harbor_id or desired_count" });
  }

  try {
    const [[{ total_count }]] = await db.query(`SELECT COUNT(*) AS total_count FROM container`);
    const [[{ sum_targets }]] = await db.query(
      `SELECT COALESCE(SUM(target_container_amount), 0) AS sum_targets 
       FROM harbor 
       WHERE id != ?`,
      [harbor_id]
    );

    const totalTargets = Number(sum_targets) + Number(desired_count); // <-- convert to numbers

    if (totalTargets > Number(total_count)) {
      return res.status(400).json({
        message: `Cannot set target: total targets (${totalTargets}) exceed total containers (${total_count})`
      });
    }

    await db.query(
      `UPDATE harbor 
       SET target_container_amount = ? 
       WHERE id = ?`,
      [desired_count, harbor_id]
    );

    res.json({ success: true, harbor_id, target_container_amount: desired_count });
  } catch (err) {
    console.error("Failed to save harbor target:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/balance-containers", async (req, res) => {
  try {
    const [harbors] = await db.query(`
        SELECT 
            h.id AS harbor_id,
            h.name AS harbor_name,
            h.target_container_amount,
            COUNT(c.id) 
            + COALESCE(SUM(incoming.incoming_count), 0) AS current_container_count
        FROM harbor h
        LEFT JOIN container c ON c.harbor_id = h.id
        LEFT JOIN (
            SELECT ro.destination_harbor, COUNT(rc.container_id) AS incoming_count
            FROM reservation_container rc
            JOIN reservation r ON rc.reservation_id = r.id
            JOIN route ro ON r.route_id = ro.id
            WHERE ro.arrival_time > NOW()
            GROUP BY ro.destination_harbor
        ) incoming ON incoming.destination_harbor = h.id
        GROUP BY h.id, h.name, h.target_container_amount;
    `);

    const surplusHarbors = [];
    const shortageHarbors = [];

    harbors.forEach(h => {
      if (h.target_container_amount > 0) {
        const diff = h.current_container_count - h.target_container_amount;
        if (diff > 0) surplusHarbors.push({ ...h, excess: diff });
        if (diff < 0) shortageHarbors.push({ ...h, needed: -diff });
      } else {
        if (h.current_container_count > 0) {
          surplusHarbors.push({ ...h, excess: h.current_container_count });
        }
      }
    });

    if (surplusHarbors.length === 0 || shortageHarbors.length === 0) {
      return res.json({ message: "No balancing needed", details: [] });
    }

    const containersToMove = {};
    for (const sh of surplusHarbors) {
        const [containers] = await db.query(
        `SELECT id FROM container WHERE harbor_id = ? LIMIT ?`,
            [sh.harbor_id, Number(sh.excess)]
        );
      containersToMove[sh.harbor_id] = containers.map(c => c.id);
    }

    const moveResults = [];
    let skippedCount = 0;

    for (const shortage of shortageHarbors) {
      let needed = shortage.needed;

      for (const surplus of surplusHarbors) {
        if (needed <= 0) break;

        const available = containersToMove[surplus.harbor_id];
        if (!available || available.length === 0) continue;

        const moving = available.splice(0, needed);

        for (const container_id of moving) {
          const [routes] = await db.query(
            `SELECT id FROM route WHERE departure_harbor = ? AND destination_harbor = ? ORDER BY departure_time ASC LIMIT 1`,
            [surplus.harbor_id, shortage.harbor_id]
          );

          if (routes.length === 0) {
            moveResults.push({
              container_id,
              from: surplus.harbor_name,
              to: shortage.harbor_name,
              status: "skipped",
              reason: "No available route"
            });
            skippedCount++;
            continue;
          }

          const route_id = routes[0].id;

          const [resRow] = await db.query(
            `INSERT INTO reservation (username, route_id, created_at) VALUES (?, ?, NOW())`,
            ['BALANCER', route_id]
          );
          const reservation_id = resRow.insertId;

          await db.query(
            `INSERT INTO reservation_container (reservation_id, container_id) VALUES (?, ?)`,
            [reservation_id, container_id]
          );

          await db.query(
            `UPDATE container SET harbor_id = ? WHERE id = ?`,
            [shortage.harbor_id, container_id]
          );

          moveResults.push({
            container_id,
            from: surplus.harbor_name,
            to: shortage.harbor_name,
            status: "success"
          });
        }

        needed -= moving.length;
      }
    }

    const summaryMessage = skippedCount > 0
      ? `Balancing complete. ${skippedCount} container(s) could not be moved due to missing routes.`
      : "Balancing complete.";

    res.json({ message: summaryMessage, details: moveResults });
  } catch (err) {
    console.error("Error during balancing:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;