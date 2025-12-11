const express = require('express');
const db = require('./db');
const router = express.Router();

router.get("/healthz", (req, res) => {
  res.status(200).send('OK');
});

async function checkDatabase() {
  try {
    await db.query("SELECT 1"); 
    return true;
  } catch (err) {
    console.error("Database check failed:", err);
    return false;
  }
}

router.get("/ready", async (req, res) => {
  const dbHealthy = await checkDatabase();
  if (dbHealthy) {
    res.status(200).send('READY');
  } else {
    res.status(503).send('NOT READY');
  }
});

module.exports = router;