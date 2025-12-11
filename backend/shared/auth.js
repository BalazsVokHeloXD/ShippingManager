const db = require('./db.js');

function requireLogin(req, res, next) {
  if (req.session?.user?.role === "user") return next();
  res.status(401).json({ error: "Unauthorized" });
}

function requireAdmin(pageKey) {
  return async (req, res, next) => {
    try {
      const username = req.session?.admin.username;
      const role = req.session?.admin?.role;

      if (!username || role !== "admin") {
        return res.status(403).json({ code: 403, message: "Forbidden" });
      }

      if (pageKey) {
        const [rows] = await db.query(
          `SELECT 1
           FROM admin_permissions AS perm
           JOIN admin_pages AS ap ON perm.page_id = ap.id
           WHERE perm.admin_username = ? AND ap.page_key = ?`,
          [username, pageKey]
        );

        if (rows.length === 0) {
          return res.status(403).json({ code: 403, message: "Permission denied" });
        }
      }

      next();
    } catch (err) {
      console.error("Error in requireAdmin middleware:", err);
      res.status(500).json({ code: 500, message: "Internal server error" });
    }
  };
}

module.exports = { requireLogin, requireAdmin };