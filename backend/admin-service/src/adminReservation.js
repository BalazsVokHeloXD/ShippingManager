const express = require('express');
const router = express.Router();
const axios = require("axios");
const db = require("../../shared/db"); 

router.get('/reservations/details', async (req, res) => {
  const { reservationId, username } = req.query;

  if (!reservationId && !username) {
    return res.status(400).json({ message: 'Please provide either reservationId or username' });
  }

  try {
    // Step 1: Build WHERE conditions dynamically
    const whereClauses = [];
    const params = [];

    if (reservationId) {
      whereClauses.push('r.id = ?');
      params.push(reservationId);
    }
    if (username) {
      whereClauses.push('r.username = ?');
      params.push(username);
    }

    const whereSQL = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

    // Step 2: Fetch reservations matching the filter
    const [reservations] = await db.query(`
      SELECT 
        r.id AS reservation_id,
        r.username,
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
      JOIN route ro ON r.route_id = ro.id
      JOIN ship sh ON ro.ship = sh.id
      JOIN harbor dep_h ON ro.departure_harbor = dep_h.id
      JOIN harbor arr_h ON ro.destination_harbor = arr_h.id
      ${whereSQL}
      ORDER BY r.created_at DESC
    `, params);

    if (reservations.length === 0) {
      return res.json([]);
    }

    // Step 3: Add container + payment details for each reservation
    const results = [];
    for (const resv of reservations) {
      const [containers] = await db.query(`
        SELECT 
          c.id, c.name, c.size,
          ct.type, ct.price
        FROM reservation_container rc
        JOIN container c ON rc.container_id = c.id
        JOIN container_type ct ON c.type_id = ct.id
        WHERE rc.reservation_id = ?
      `, [resv.reservation_id]);

      const totalPrice = resv.price + containers.reduce((sum, c) => sum + c.price, 0);

      const [paymentRow] = await db.query(`
        SELECT status, payment_link FROM payment
        WHERE id = ?
        LIMIT 1
      `, [resv.reservation_id]);

      results.push({
        reservationId: resv.reservation_id,
        username: resv.username,
        createdAt: resv.created_at,
        totalPrice,
        paymentStatus: paymentRow.length > 0 ? paymentRow[0].status : 'Pending',
        paymentLink: paymentRow.length > 0 ? paymentRow[0].payment_link : null,
        route: {
          id: resv.route_id,
          departure_time: resv.departure_time,
          arrival_time: resv.arrival_time,
          price: resv.price,
          shipname: resv.shipname,
          departure_harbor: resv.departure_harbor,
          departure_flag: resv.departure_flag,
          destination_harbor: resv.destination_harbor,
          destination_flag: resv.destination_flag
        },
        containers
      });
    }

    res.json(results);
  } catch (err) {
    console.error('Error fetching admin reservation details:', err);
    res.status(500).json({ message: 'Failed to fetch reservation details' });
  }
});

router.post("/reservation/callback", async (req, res) => {
  const { reservationId } = req.body;

  try {
    const [rows] = await db.query(
      "SELECT payment_link FROM payment WHERE id = ?",
      [reservationId]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Payment not found" });
    }

    const paymentLink = rows[0].payment_link;

    const url = new URL(paymentLink);
    const paymentId = url.searchParams.get("Id");

    if (!paymentId) {
      return res
        .status(400)
        .json({ message: "Invalid payment link, no PaymentId found" });
    }
    console.log(process.env.PUBLIC_URL + "/api/ps/callback");
    const response = await axios.post(
      process.env.PUBLIC_URL + "/callback",
      { PaymentId: paymentId },
      {
        withCredentials: true,  
        headers: {
          "Content-Type": "application/json",
          Cookie: req.headers.cookie || ""
        }
      }
    );


    res.json({
      message: "Payment verification initiated",
      paymentId,
      callbackResponse: response.data,
    });
  } catch (err) {
    console.error("Error triggering payment callback:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;