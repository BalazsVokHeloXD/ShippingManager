const amqp = require("amqplib");
const QUEUE = "reservation_queue";

async function publishReservation(reservationData) {
  const conn = await amqp.connect(process.env.RABBITMQ_URL);
  const channel = await conn.createChannel();
  await channel.assertQueue(QUEUE, { durable: true });
  channel.sendToQueue(QUEUE, Buffer.from(JSON.stringify(reservationData)), { persistent: true });
  await channel.close();
  await conn.close();
}

module.exports = { publishReservation };