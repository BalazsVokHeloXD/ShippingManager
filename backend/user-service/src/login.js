const express = require('express');
const bcrypt = require('bcrypt');
const db = require("../../shared/db");

const router = express.Router();

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const [rows] = await db.query(
      "SELECT * FROM client_login WHERE username = ?",
      [username]
    );

    if (rows.length === 0) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    req.session.user = {
      username,
      role: "user",
    };

    res.json({ success: true });
  } catch (err) {
    console.error("Error during user login:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

router.get("/session", (req, res) => {
  if (req.session.user) {
    res.json({ loggedIn: true, ...req.session.user });
  } else {
    res.json({ loggedIn: false });
  }
});

router.post("/logout", (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ success: false });
    res.clearCookie("user.sid");
    res.json({ success: true });
  });
});

module.exports = router;