import express from "express";
import { contractorRoutes } from "./src/modules/contractors/contractor.routes.js";

const app = express();
const PORT = process.env.PORT || 10114;

app.use(express.json());

app.get("/health", (_req, res) => res.status(200).json({ status: "ok" }));

// El gateway quita /api/contractors y reenvía las rutas restantes aquí.
app.use("/", contractorRoutes);

app.get("/", (_req, res) => {
  res.send("Contractors Services is running");
});

app.listen(PORT, () => {
  console.log(`Contractors Services is running on port ${PORT}`);
});
