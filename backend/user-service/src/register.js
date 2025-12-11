const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const db = require("../../shared/db");
const { validatePassword } = require("../../shared/passwordValidator.js");

router.post('/register', async (req, res) => {
  const { username, password, passwordAgain, firstname, lastname, email } = req.body;

  if (!username || !password || !passwordAgain || !firstname || !lastname || !email) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  if (password !== passwordAgain) {
    return res.status(400).json({ message: 'Passwords do not match.' });
  }

  const validationError = validatePassword(password);
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [existing] = await conn.query(
      'SELECT username FROM client_login WHERE username = ?',
      [username]
    );
    if (existing.length > 0) {
      await conn.rollback();
      return res.status(400).json({ message: 'Username already taken.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await conn.query(
      'INSERT INTO client_login (username, password) VALUES (?, ?)',
      [username, hashedPassword]
    );

    await conn.query(
      'INSERT INTO client (username, firstname, lastname, email) VALUES (?, ?, ?, ?)',
      [username, firstname, lastname, email]
    );

    await conn.commit();
    res.status(201).json({ message: 'User registered successfully.' });
  } catch (err) {
    await conn.rollback();
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Server error during registration.' });
  } finally {
    conn.release();
  }
});

module.exports = router;