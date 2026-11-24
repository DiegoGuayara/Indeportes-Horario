import express from "express";
import { scheduleRoutes } from "./src/modules/schedules/schedule.routes.js";

const app = express();
const PORT = process.env.PORT || 10115;

app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

// El gateway quita /api/schedules y reenvía la ruta restante al router.
app.use("/", scheduleRoutes);

app.get("/", (req, res) => {
  res.send("Schedules Services is running");
});

app.listen(PORT, () => {
  console.log(`Schedules Services is running on port ${PORT}`);
});
