const express = require('express');
const bcrypt = require('bcrypt');
const db = require("../../shared/db");
const router = express.Router();
const { validatePassword } = require("../../shared/passwordValidator.js");

router.get("/account", async (req, res) => {
  const username = req.session.user?.username; // unified session check

  if (!username) return res.status(401).json({ message: "Not logged in" });

  try {
    const [[client]] = await db.query(
      `SELECT firstname, lastname, birthdate, birthplace, email, country_iso3, zipcode, address
       FROM client
       WHERE username = ?`,
      [username]
    );

    if (!client) {
      return res.status(404).json({ message: "Client data not found" });
    }

    // Format birthdate as yyyy-MM-dd
    const formattedBirthdate = client.birthdate?.toISOString().split("T")[0];
    client.birthdate = formattedBirthdate;

    res.json({ account: client });
  } catch (err) {
    console.error("Fetch error:", err);
    res.status(500).json({ message: "Failed to fetch account info" });
  }
});

router.post("/account/update-details", async (req, res) => {
  const username = req.session.user?.username;

  if (!username) return res.status(401).json({ message: "Not logged in" });

  const { firstname, lastname, birthdate, birthplace, email } = req.body;

  try {
    await db.execute(
      "UPDATE client SET firstname = ?, lastname = ?, birthdate = ?, birthplace = ?, email = ? WHERE username = ?",
      [firstname, lastname, birthdate, birthplace, email, username]
    );

    res.json({ message: "Account details updated" });
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ message: "Failed to update account details" });
  }
});

router.post("/account/update-billing", async (req, res) => {
  const username = req.session.user?.username;

  if (!username) return res.status(401).json({ message: "Not logged in" });

  const { country_iso3, zipcode, address } = req.body;

  try {
    await db.execute(
      "UPDATE client SET country_iso3 = ?, zipcode = ?, address = ? WHERE username = ?",
      [country_iso3, zipcode, address, username]
    );
    res.json({ message: "Billing info updated" });
  } catch (err) {
    console.error("Update billing error:", err);
    res.status(500).json({ message: "Failed to update billing info" });
  }
});

router.post("/account/update-password", async (req, res) => {
  const username = req.session.user?.username;

  if (!username) return res.status(401).json({ message: "Not logged in" });

  const { newPassword, newPasswordAgain } = req.body;

  if (!newPassword || newPassword !== newPasswordAgain) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  const validationError = validatePassword(newPassword);
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  try {
    const hashed = await bcrypt.hash(newPassword, 10);
    await db.execute(
      "UPDATE client_login SET password = ? WHERE username = ?",
      [hashed, username]
    );
    res.json({ message: "Password updated" });
  } catch (err) {
    console.error("Update password error:", err);
    res.status(500).json({ message: "Failed to update password" });
  }
});

module.exports = router;