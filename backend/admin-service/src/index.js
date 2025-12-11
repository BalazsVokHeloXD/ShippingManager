const express = require("express");
const createSessionMiddleware = require("../../shared/session");
const { requireAdmin } = require("../../shared/auth");
const healthRoute = require("../../shared/health.js");
const adminRoutes = require("./admin");
const adminContainerRoutes = require("./adminContainer");
const adminContainerBalancerRoutes = require("./adminContainerBalancer");
const adminReservationRoutes = require("./adminReservation");
const adminHarborRoutes = require("./adminHarbor");
const adminCountryRoutes = require("./adminCountry");
const adminRouteRoutes = require("./adminRoute");
const adminLoginRoutes = require("./adminLogin");

const app = express();
app.use(express.json());
app.set('trust proxy', 1);
app.use(createSessionMiddleware("admin_sessions"));

app.use((req, res, next) => {
  console.log(`[Admin Service] ${req.method} ${req.originalUrl}`);
  next();
});


app.use("/", healthRoute);
app.use("/", adminLoginRoutes);
app.use("/", requireAdmin("administrators"), adminRoutes);
app.use("/", requireAdmin("containers"), adminContainerRoutes);
app.use("/", requireAdmin("containers"), adminContainerBalancerRoutes);
app.use("/", requireAdmin("reservations"), adminReservationRoutes);
app.use("/", requireAdmin("harbors"), adminHarborRoutes);
app.use("/", requireAdmin(""), adminCountryRoutes);
app.use("/", requireAdmin("routes"), adminRouteRoutes);

const PORT = process.env.PORT || 5004;
app.listen(PORT, () => console.log(`Admin service running on ${PORT} in production: ${process.env.NODE_ENV === 'production'} mode`));