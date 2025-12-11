const session = require("express-session");
const MySQLStoreFactory = require("express-mysql-session");
const db = require("./db.js");

const MySQLStore = MySQLStoreFactory(session);

function createSessionMiddleware(tableName = "sessions") {
  const sessionStore = new MySQLStore(
    {
      schema: {
        tableName,
        columnNames: {
          session_id: "session_id",
          expires: "expires",
          data: "data",
        },
      },
    },
    db
  );
  const isProd = process.env.NODE_ENV === "production";
  console.log("Prod is: " + isProd);
  return session({
    key: tableName === "admin_sessions" ? "admin.sid" : "shipping.sid",
    secret: process.env.SESSION_SECRET || "supersecret",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      maxAge: 1000 * 60 * 30, // 30 minutes
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      domain: isProd ? 'sm.local.lan' : undefined,
    },
  });
}

module.exports = createSessionMiddleware;