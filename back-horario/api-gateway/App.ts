import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";

const app = express();
const PORT = Number(process.env.PORT ?? 10111);

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
