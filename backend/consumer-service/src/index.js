const amqp = require("amqplib");
const db = require("../../shared/db");
const axios = require("axios");
require("dotenv").config();

async function startWorker() {
  const conn = await amqp.connect(process.env.RABBITMQ_URL || "amqp://localhost");
  const channel = await conn.createChannel();
  const queue = "reservation_queue";

  await channel.assertQueue(queue, { durable: true });
  console.log("Reservation worker listening...");

  const connDb = await db.getConnection();
  console.log("DB connection established");

  channel.consume(queue, async (msg) => {
    if (!msg) return;
    const data = JSON.parse(msg.content.toString());
    const { reservationId, userId, routeId, containerIds } = data;

    try {
      await connDb.beginTransaction();

      console.log("0. Validate input parameters");
      if (!reservationId || !userId || !routeId || !Array.isArray(containerIds) || containerIds.length === 0) {
        throw new Error("Missing or invalid parameters received");
      }

      console.log("1. Check container availability (latest reservation)");
      const placeholders = containerIds.map(() => "?").join(",");
      const [conflicting] = await connDb.query(
        `
        SELECT c.id
        FROM container c
        JOIN reservation_container rc ON c.id = rc.container_id
        JOIN reservation r ON rc.reservation_id = r.id
        JOIN route ro ON r.route_id = ro.id
        -- Only consider the latest reservation per container
        JOIN (
            SELECT t.container_id, t.arrivaltime
            FROM (
                SELECT rc2.container_id, ro2.arrival_time AS arrivaltime,
                      ROW_NUMBER() OVER (PARTITION BY rc2.container_id ORDER BY rc2.id DESC) AS rn
                FROM reservation_container rc2
                JOIN reservation r2 ON rc2.reservation_id = r2.id
                JOIN route ro2 ON r2.route_id = ro2.id
            ) t
            WHERE t.rn = 1
        ) last_res ON last_res.container_id = c.id
        WHERE c.id IN (${placeholders})
          AND (last_res.container_id IS NOT NULL AND last_res.arrivaltime > NOW())
        `,
        containerIds
      );

      if (conflicting.length > 0) {
        throw new Error(
          `Containers already reserved or in transit: ${conflicting.map(c => c.id).join(", ")}`
        );
      }

      console.log("2. Check ship capacity BEFORE inserting");
      const [[route]] = await connDb.query(
        `SELECT r.ship, r.price, r.destination_harbor, r.departure_harbor, s.capacity
         FROM route r
         JOIN ship s ON r.ship = s.id
         WHERE r.id = ?`,
        [routeId]
      );

      if (!route) {
        throw new Error(`Route ${routeId} not found`);
      }

      const [reservedCount] = await connDb.query(
        `SELECT COUNT(*) as count
         FROM reservation_container rc
         JOIN reservation r ON rc.reservation_id = r.id
         WHERE r.route_id = ?`,
        [routeId]
      );

      if (reservedCount[0].count + containerIds.length > route.capacity) {
        throw new Error("Ship capacity exceeded");
      }

      console.log("3. Insert reservation_container entries");
      const insertValues = containerIds.map((id) => [reservationId, id]);
      await connDb.query(
        "INSERT INTO reservation_container (reservation_id, container_id) VALUES ?",
        [insertValues]
      );

      console.log("4. Update container harbor_id to destination harbor");
      await connDb.query(
        `UPDATE container SET harbor_id = ? WHERE id IN (${placeholders})`,
        [route.destination_harbor, ...containerIds]
      );

      console.log("5. Calculate total price");
      const [[containerRow]] = await connDb.query(
        `SELECT COALESCE(SUM(ct.price), 0) AS total
         FROM reservation_container rc
         JOIN container c ON rc.container_id = c.id
         JOIN container_type ct ON c.type_id = ct.id
         WHERE rc.reservation_id = ?`,
        [reservationId]
      );
      const totalPrice = Number(route.price) + Number(containerRow.total);

      console.log("6. Create Barion payment");
      const barionPayload = {
        POSKey: process.env.BARION_POSKEY,
        PaymentType: "Immediate",
        GuestCheckOut: true,
        Locale: "en-US",
        FundingSources: ["BankCard"],
        Currency: "HUF",
        Transactions: [
          {
            POSTransactionId: `RES-${reservationId}`,
            Payee: process.env.BARION_PAYEE,
            Total: totalPrice.toString(),
            Comment: `Reservation #${reservationId}`,
            Items: [
              {
                Name: "Shipping Reservation",
                Quantity: 1,
                Unit: "unit",
                Description: `Route #${routeId}`,
                UnitPrice: totalPrice.toString(),
                ItemTotal: totalPrice.toString(),
              },
            ],
          },
        ],
        RedirectUrl: process.env.PUBLIC_URL,
        CallbackUrl: `${process.env.PUBLIC_URL}/api/ps/callback`,
      };

      const paymentInit = await axios.post(
        "https://api.test.barion.com/v2/Payment/Start",
        barionPayload,
        { headers: { "Content-Type": "application/json" } }
      );
      const paymentLink = paymentInit.data.GatewayUrl;

      console.log("7. Insert into payment table");
      await connDb.execute(
        `INSERT INTO payment (id, transaction, username, amount, status, payment_link)
         VALUES (?, ?, ?, ?, 'Pending', ?)`,
        [reservationId, `RES-${reservationId}`, userId, totalPrice, paymentLink]
      );

      console.log("8. Update reservation status to success");
      await connDb.execute(
        "UPDATE reservation_status SET status = 'success' WHERE reservation_id = ?",
        [reservationId]
      );

      console.log("9. Commit transaction");
      await connDb.commit();

      console.log(`Reservation ${reservationId} processed successfully`);
      channel.ack(msg);

    } catch (err) {
      await connDb.rollback();
      console.error(`Failed to process reservation ${reservationId}:`, err.message);

      await db.execute(
        "UPDATE reservation_status SET status = 'failed', error = ? WHERE reservation_id = ?",
        [err.message, reservationId]
      );

      channel.ack(msg);
    }
  });
}

startWorker().catch(console.error);