import "dotenv/config";
import express from "express";
import { attendanceRoutes } from "./src/modules/attendance/attendance.routes.js";

const app = express();
const PORT = Number(process.env.PORT ?? 10112);

app.use(express.json());

app.get("/", (_req, res) => {
  res.send("Attendance Service is running");
});

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", service: "attendance-service" });
});

// El gateway quita /api/attendance y reenvía la solicitud a /events.
app.use("/", attendanceRoutes);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Attendance Service is running on port ${PORT}`);
});
