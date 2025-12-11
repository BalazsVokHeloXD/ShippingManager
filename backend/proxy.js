const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();

const routeMap = [
  { prefix: "/api/us", target: "http://localhost:5001" },
  { prefix: "/api/rs", target: "http://localhost:5002" },
  { prefix: "/api/ps", target: "http://localhost:5003" },
  { prefix: "/api/as", target: "http://localhost:5004" },
];

app.use((req, res, next) => {
  const route = routeMap.find(r => req.originalUrl.startsWith(r.prefix));
  if (route) {
    createProxyMiddleware({
      target: route.target,
      changeOrigin: true,
      logLevel: "debug",
      pathRewrite: (path) => path.replace(route.prefix, ""),
      onProxyReq: (proxyReq) => {
        console.log(`[Proxy] Forwarding ${req.method} ${req.originalUrl} -> ${route.target}${req.originalUrl.replace(route.prefix, "")}`);
      },
      onProxyRes: (proxyRes) => {
        console.log(`[Proxy Response] ${req.method} ${req.originalUrl} <- ${proxyRes.statusCode}`);
      },
    })(req, res, next);
  } else {
    res.status(404).send("Service not found");
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Dev proxy running on ${PORT}`));