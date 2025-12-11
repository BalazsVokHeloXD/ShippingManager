const express = require('express');
const router = express.Router();

router.get('/crash', async (req, res) => {
  res.send('Crashing pod...');
  process.exit(1);
});

router.get('/freeze', async (req, res) => {
  res.send('Freezing pod...');
  while(true) {}
});

module.exports = router;