const express = require("express");
const createSessionMiddleware = require("../../shared/session");
const healthRoute = require("../../shared/health.js");
const paymentRoutes = require("./payment");

const app = express();
app.use(express.json());
app.set('trust proxy', 1);
app.use(createSessionMiddleware("user_sessions"));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`[Payment Service] ${req.method} ${req.originalUrl}`);
  next();
});

app.use("/", healthRoute);
app.use("/", paymentRoutes);

const PORT = process.env.PORT || 5003;
app.listen(PORT, () => console.log(`Payment service running on ${PORT} in production: ${process.env.NODE_ENV === 'production'} mode`));