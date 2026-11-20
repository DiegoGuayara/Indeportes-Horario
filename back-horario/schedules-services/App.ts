import express from "express";

const app = express();
const PORT = process.env.PORT || 10115;

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Schedules Services is running");
});

app.listen(PORT, () => {
  console.log(`Schedules Services is running on port ${PORT}`);
});
