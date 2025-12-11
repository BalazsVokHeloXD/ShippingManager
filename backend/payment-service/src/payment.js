const express = require('express');
const router = express.Router();
const axios = require('axios');
const db = require("../../shared/db");
const { requireLogin } = require("../../shared/auth");
require('dotenv').config();

router.post('/search', requireLogin, async (req, res) => {
  const { reservationId, birthdate } = req.body;

  if (!reservationId || !birthdate) {
    return res.status(400).json({ message: 'Missing reservationId or birthdate' });
  }

  try {
    const [[reservation]] = await db.query(`
      SELECT r.id AS reservation_id, r.username, r.route_id
      FROM reservation r
      JOIN client cl ON r.username = cl.username
      WHERE r.id = ? AND DATE(cl.birthdate) = DATE(?)
    `, [reservationId, birthdate]);

    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found or birthdate mismatch' });
    }

    const [[route]] = await db.query(`
      SELECT price FROM route WHERE id = ?
    `, [reservation.route_id]);

    if (!route) {
      return res.status(404).json({ message: 'Route not found' });
    }

    const [containers] = await db.query(`
      SELECT ct.price
      FROM reservation_container rc
      JOIN container c ON rc.container_id = c.id
      JOIN container_type ct ON c.type_id = ct.id
      WHERE rc.reservation_id = ?
    `, [reservationId]);

    const containerTotal = containers.reduce((sum, c) => sum + c.price, 0);
    const totalPrice = route.price + containerTotal;

    const [[payment]] = await db.query(`
      SELECT payment_link FROM payment
      WHERE id = ?
    `, [reservationId]);

    if (!payment || !payment.payment_link) {
      return res.status(404).json({ message: 'Payment link not found' });
    }

    res.json({
      price: totalPrice,
      paymentLink: payment.payment_link
    });

  } catch (err) {
    console.error('Error processing payment search:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/callback', async (req, res) => {
  const data = req.body;
  console.log(data);

  try {
    const paymentId = data.PaymentId;
    console.log('Parsed PaymentId:', paymentId);
    if (!paymentId) {
      console.warn('Missing PaymentId in Barion callback');
      return res.status(400).send('Bad Request');
    }

    const POSKey = process.env.BARION_POSKEY;

    let barionResponse;
    try {
      barionResponse = await axios.get(
        `https://api.test.barion.com/v4/payment/${paymentId}/paymentstate`,
        {
          headers: {
            'x-pos-Key': POSKey,
            Accept: 'application/json',
          },
        }
      );
    } catch (err) {
      if (err.response && err.response.status === 400) {
        console.warn(`Payment ${paymentId} not found in Barion`);
        return res.status(404).send('Payment not found');
      }
      throw err;
    }

    const paymentState = barionResponse.data;
    const status = paymentState.Status;
    const transactions = paymentState.Transactions;

    if (!status || !transactions) {
      console.warn('Missing status or transactions in Barion payment state');
      return res.status(404).send('Payment not found');
    }

    const transaction = transactions[0]?.POSTransactionId;
    if (!transaction) {
      console.warn('Missing transaction data in Barion payment state');
      return res.status(400).send('Bad Request');
    }

    const reservationIdMatch = transaction.match(/^RES-(\d+)$/);
    if (!reservationIdMatch) {
      console.warn('Invalid transaction format:', transaction);
      return res.status(400).send('Bad Request');
    }
    const reservationId = parseInt(reservationIdMatch[1], 10);

    let newStatus;
    switch (status) {
      case 'Succeeded':
        newStatus = 'Settled';
        break;
      case 'Failed':
      case 'Canceled':
        newStatus = 'Due';
        break;
      case 'Expired':
        newStatus = 'Overdue';
        break;
      default:
        newStatus = 'Pending';
    }

    await db.execute('UPDATE payment SET status = ? WHERE id = ?', [newStatus, reservationId]);
    console.log(`Payment status for reservation ${reservationId} updated to ${newStatus}`);

    res.status(200).send('OK');
  } catch (err) {
    console.error('Error processing Barion payment callback:', err);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;