import "dotenv/config";
import express from "express";
import { authRoutes } from "./src/modules/auth/auth.routes.js";
import { usersRoutes } from "./src/modules/users/users.routes.js";

const app = express();
const PORT = Number(process.env.PORT ?? 10113);

app.use(express.json());

app.get("/", (_req, res) => {
  res.send("Auth Service is running");
});

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", service: "auth-service" });
});

// El gateway quita /api/auth y reenvía la solicitud a /login.
app.use("/", authRoutes);
app.use("/", usersRoutes);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Auth Service is running on port ${PORT}`);
});
