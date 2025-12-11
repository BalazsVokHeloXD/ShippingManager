const express = require('express');
const router = express.Router();
const db = require("../../shared/db");
const { publishReservation } = require('./reservationProducer');

router.post("/reservations", async (req, res) => {
  const { routeId, containerIds } = req.body;
  const userId = req.session.user?.username;
  if (!userId || !routeId || !Array.isArray(containerIds) || containerIds.length === 0) {
    return res.status(400).json({ success: false, message: "Missing required reservation data." });
  }
  console.log(userId);
  try {
    const [result] = await db.execute(
      "INSERT INTO reservation (username, route_id) VALUES (?, ?)",
      [userId, routeId]
    );
    const reservationId = result.insertId;

    await db.execute(
      "INSERT INTO reservation_status (reservation_id, status) VALUES (?, 'pending')",
      [reservationId]
    );

    await publishReservation({
      reservationId,
      userId,
      routeId,
      containerIds
    });

    res.status(201).json({
      success: true,
      message: "Reservation request received. Processing...",
      reservationId
    });

  } catch (err) {
    console.error("Failed to queue reservation:", err);
    res.status(500).json({ success: false, message: "Failed to submit reservation" });
  }
});

router.get("/reservations/:id/status", async (req, res) => {
  const { id } = req.params;
  try {
    const [[row]] = await db.query(
      "SELECT status, error FROM reservation_status WHERE reservation_id = ?",
      [id]
    );

    if (!row) return res.status(404).json({ error: "Reservation not found" });
    res.json(row);
  } catch (err) {
    res.status(500).json({ status: "error", error: "Cannot fetch status" });
  }
});

router.get("/reservations", async (req, res) => {
  const username = req.session.user?.username;

  if (!username) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  try {
    const [reservations] = await db.query(
      `
      SELECT 
        r.id AS reservation_id,
        r.created_at,
        ro.id AS route_id,
        ro.departure_time,
        ro.arrival_time,
        ro.price,
        sh.name AS shipname,
        dep_h.name AS departure_harbor,
        dep_h.country_iso3 AS departure_flag,
        arr_h.name AS destination_harbor,
        arr_h.country_iso3 AS destination_flag
      FROM reservation r
      JOIN reservation_status rs ON r.id = rs.reservation_id
      JOIN route ro ON r.route_id = ro.id
      JOIN ship sh ON ro.ship = sh.id
      JOIN harbor dep_h ON ro.departure_harbor = dep_h.id
      JOIN harbor arr_h ON ro.destination_harbor = arr_h.id
      WHERE r.username = ?
        AND rs.status = 'success'
      ORDER BY r.created_at DESC
      `,
      [username]
    );

    const results = [];
    for (const resv of reservations) {
      const [containers] = await db.query(
        `
        SELECT 
          c.id, c.name, c.size,
          ct.type, ct.price
        FROM reservation_container rc
        JOIN container c ON rc.container_id = c.id
        JOIN container_type ct ON c.type_id = ct.id
        WHERE rc.reservation_id = ?
        `,
        [resv.reservation_id]
      );

      const totalPrice = resv.price + containers.reduce((sum, c) => sum + c.price, 0);

      const [paymentRow] = await db.query(
        `
        SELECT status FROM payment
        WHERE id = ?
        LIMIT 1
        `,
        [resv.reservation_id]
      );

      const paymentStatus = paymentRow.length > 0 ? paymentRow[0].status : "Pending";

      results.push({
        reservationId: resv.reservation_id,
        createdAt: resv.created_at,
        totalPrice,
        paymentStatus,
        route: {
          id: resv.route_id,
          departure_time: resv.departure_time,
          arrival_time: resv.arrival_time,
          price: resv.price,
          shipname: resv.shipname,
          departure_harbor: resv.departure_harbor,
          departure_flag: resv.departure_flag,
          destination_harbor: resv.destination_harbor,
          destination_flag: resv.destination_flag,
        },
        containers,
      });
    }

    res.json(results);
  } catch (err) {
    console.error("Error fetching reservation history:", err);
    res.status(500).json({ message: "Failed to fetch reservation history" });
  }
});

router.delete("/reservations/:id", async (req, res) => {
  const username = req.session.user?.username;
  const reservationId = req.params.id;

  if (!username) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [[reservation]] = await conn.query(
      `
      SELECT r.id, r.route_id, ro.departure_harbor
      FROM reservation r
      JOIN route ro ON r.route_id = ro.id
      WHERE r.id = ? AND r.username = ?
      `,
      [reservationId, username]
    );

    if (!reservation) {
      throw new Error("Reservation not found or unauthorized");
    }

    const departureHarborId = reservation.departure_harbor;

    const [containerRows] = await conn.query(
      `SELECT container_id FROM reservation_container WHERE reservation_id = ?`,
      [reservationId]
    );

    const containerIds = containerRows.map(row => row.container_id);

    if (containerIds.length > 0) {
      await conn.query(
        `
        UPDATE container
        SET harbor_id = ?
        WHERE id IN (${containerIds.map(() => "?").join(",")})
        `,
        [departureHarborId, ...containerIds]
      );
    }

    await conn.query(`DELETE FROM payment WHERE id = ?`, [reservationId]);
    await conn.query(`DELETE FROM reservation_container WHERE reservation_id = ?`, [reservationId]);
    await conn.query(`DELETE FROM reservation WHERE id = ?`, [reservationId]);

    await conn.commit();
    res.json({ message: "Reservation deleted and containers reverted" });

  } catch (err) {
    await conn.rollback();
    console.error("Delete reservation error:", err.message || err);
    res.status(500).json({ message: "Failed to delete reservation" });
  } finally {
    conn.release();
  }
});

module.exports = router;