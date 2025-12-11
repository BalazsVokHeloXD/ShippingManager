const express = require("express");
const createSessionMiddleware = require("../../shared/session");
const healthRoute = require("../../shared/health.js");
const { requireLogin } = require("../../shared/auth");
const reservationRoutes = require("./reservation");
const containerRoutes = require("./container");
const routeRoutes = require("./routes");

const app = express();
app.use(express.json());
app.set('trust proxy', 1);
app.use(createSessionMiddleware("user_sessions"));

app.use((req, res, next) => {
  console.log(`[Reservation Service] ${req.method} ${req.originalUrl}`);
  next();
});

app.use("/", healthRoute);
app.use("/", requireLogin, routeRoutes);
app.use("/", requireLogin, containerRoutes);
app.use("/", requireLogin,  reservationRoutes);

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => console.log(`Reservation service running on ${PORT} in production: ${process.env.NODE_ENV === 'production'} mode`));