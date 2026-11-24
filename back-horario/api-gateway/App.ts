import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";

const app = express();
const PORT = Number(process.env.PORT ?? 10111);
const allowedOrigins = new Set(
  (process.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
);

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin && allowedOrigins.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Authorization,Content-Type");
    res.setHeader("Access-Control-Max-Age", "600");
  }

  if (req.method === "OPTIONS") {
    if (origin && !allowedOrigins.has(origin)) {
      res.status(403).json({ message: "Origen no permitido." });
      return;
    }
    res.sendStatus(204);
    return;
  }

  next();
});

const serviceProxies = [
  {
    path: "/api/auth",
    target: process.env.AUTH_SERVICE_URL ?? "http://localhost:10113",
  },
  {
    path: "/api/attendance",
    target: process.env.ATTENDANCE_SERVICE_URL ?? "http://localhost:10112",
  },
  {
    path: "/api/contractors",
    target: process.env.CONTRACTORS_SERVICE_URL ?? "http://localhost:10114",
  },
  {
    path: "/api/schedules",
    target: process.env.SCHEDULES_SERVICE_URL ?? "http://localhost:10115",
  },
] as const;

app.get("/", (_req, res) => {
  res.send("API Gateway is running");
});

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

// Mount proxies before express.json() so request bodies stream through unchanged.
for (const { path, target } of serviceProxies) {
  app.use(
    path,
    createProxyMiddleware({
      target,
      changeOrigin: true,
      on: {
        error: (error) => {
          console.error(`Proxy error for ${path}:`, error.message);
        },
      },
    }),
  );
}

app.use(express.json());

app.use((_req, res) => {
  res.status(404).json({ message: "Ruta no encontrada en el API Gateway" });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`API Gateway is running on port ${PORT}`);
});
