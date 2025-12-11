const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require("../../shared/db");
const { requireAdmin } = require("../../shared/auth");

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const [rows] = await db.query(
      "SELECT * FROM admin_login WHERE username = ?",
      [username]
    );

    if (rows.length === 0) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    const admin = rows[0];
    const match = await bcrypt.compare(password, admin.password);

    if (!match) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    // Save admin info in session
    req.session.admin = {
      username,
      role: "admin",
    };

    res.json({ success: true });
  } catch (err) {
    console.error("Error during admin login:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

router.get("/session", (req, res) => {
  if (req.session.admin) {
    res.json({ loggedIn: true, ...req.session.admin });
  } else {
    res.json({ loggedIn: false });
  }
});

router.post("/logout", (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ success: false });
    res.clearCookie("admin.sid");
    res.json({ success: true });
  });
});


module.exports = router;