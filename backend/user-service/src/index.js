const express = require("express");
const createSessionMiddleware = require("../../shared/session.js");
const { requireLogin } = require("../../shared/auth.js");
const healthRoute = require("../../shared/health.js");
const loginRoutes = require("./login.js");
const accountRoutes = require("./account.js");
const registerRoutes = require("./register.js");
const resiliencetestRoutes = require("./resiliencetest.js");

const app = express();
app.use(express.json());
app.set('trust proxy', 1);
app.use(createSessionMiddleware("user_sessions"));

app.use((req, res, next) => {
  console.log(`[User Service] ${req.method} ${req.originalUrl}`);
  next();
});

app.use("/", healthRoute);
app.use("/", resiliencetestRoutes);
app.use("/", loginRoutes);
app.use("/", registerRoutes);
app.use("/", requireLogin, accountRoutes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`User service running on ${PORT} in production: ${process.env.NODE_ENV === 'production'} mode`));