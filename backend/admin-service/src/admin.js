const express = require('express');
const router = express.Router();
const bcrypt = require("bcrypt");
const db = require('../../shared/db.js');
const { validatePassword } = require("../../shared/passwordValidator.js");

router.get('/admins', async (req, res) => {
  try {
    const sql = `
      SELECT 
        a.username, 
        p.page_key, 
        p.page_name
      FROM admin_login a
      LEFT JOIN admin_permissions ap ON a.username = ap.admin_username
      LEFT JOIN admin_pages p ON ap.page_id = p.id
      ORDER BY a.username, p.page_name
    `;

    const [rows] = await db.query(sql);

    const admins = {};
    rows.forEach(row => {
      if (!admins[row.username]) {
        admins[row.username] = {
          username: row.username,
          permissions: []
        };
      }
      if (row.page_key) {
        admins[row.username].permissions.push({
          pageKey: row.page_key,
          pageName: row.page_name
        });
      }
    });

    const result = Object.values(admins);

    res.json(result);

  } catch (err) {
    console.error('Error fetching admins with permissions:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/admin-pages', async (req, res) => {
  try {
    const [pages] = await db.query(`
      SELECT page_key, page_name 
      FROM admin_pages 
      ORDER BY page_name
    `);

    res.json(pages);
  } catch (err) {
    console.error('Error fetching admin pages:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post("/admins", async (req, res) => {
  const { username, password, passwordAgain, permissions } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required." });
  }

  if (password !== passwordAgain) {
    return res.status(400).json({ message: 'Passwords do not match.' });
  }

  const validationError = validatePassword(password);
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  if (permissions && !Array.isArray(permissions)) {
    return res.status(400).json({ message: "Permissions must be an array." });
  }

  try {
    const [existing] = await db.query(
      "SELECT username FROM admin_login WHERE username = ?",
      [username]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: "Username already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query(
      "INSERT INTO admin_login (username, password) VALUES (?, ?)",
      [username, hashedPassword]
    );

    if (permissions && permissions.length > 0) {
      const [pages] = await db.query(
        `SELECT id, page_key FROM admin_pages WHERE page_key IN (?)`,
        [permissions]
      );

      if (pages.length !== permissions.length) {
        return res.status(400).json({ message: "Some permissions are invalid." });
      }

      const values = pages.map((page) => [username, page.id]);
      await db.query(
        `INSERT INTO admin_permissions (admin_username, page_id) VALUES ?`,
        [values]
      );
    }

    res.status(201).json({ message: "Admin created successfully." });
  } catch (err) {
    console.error("Error creating admin:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get('/permissions', async (req, res) => {
  try {
    const username = req.session?.admin.username;
    if (!username) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const [rows] = await db.query(
      `SELECT ap.page_key, ap.page_name
       FROM admin_permissions AS perm
       JOIN admin_pages AS ap ON perm.page_id = ap.id
       WHERE perm.admin_username = ?`,
      [username]
    );

    res.json({
      username,
      permissions: rows.map(row => ({
        pageKey: row.page_key,
        pageName: row.page_name,
      })),
    });
  } catch (err) {
    console.error("Error fetching permissions:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});


router.put('/admins/:username/permissions', async (req, res) => {
  const username = req.params.username;
  const { permissions } = req.body;
  console.log(req.session?.admin.username);
  console.log(username);
  if (req.session?.admin.username === username) {
    return res.status(403).json({ message: "You cannot edit your own permissions." });
  }

  if (!Array.isArray(permissions)) {
    return res.status(400).json({ message: "Permissions must be an array." });
  }

  try {
    const [admins] = await db.query(
      "SELECT username FROM admin_login WHERE username = ?",
      [username]
    );
    if (admins.length === 0) {
      return res.status(404).json({ message: "Admin not found." });
    }

    const [pages] = await db.query(
      `SELECT id, page_key FROM admin_pages WHERE page_key IN (?)`,
      [permissions]
    );

    if (pages.length !== permissions.length) {
      return res.status(400).json({ message: "Some permissions are invalid." });
    }

    await db.query(
      "DELETE FROM admin_permissions WHERE admin_username = ?",
      [username]
    );

    if (pages.length > 0) {
      const values = pages.map(page => [username, page.id]);
      await db.query(
        `INSERT INTO admin_permissions (admin_username, page_id) VALUES ?`,
        [values]
      );
    }

    res.json({ message: "Permissions updated successfully." });
  } catch (err) {
    console.error("Error updating admin permissions:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;