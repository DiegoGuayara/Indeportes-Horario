import express from "express";

const app = express();
const PORT = process.env.PORT || 10111;

app.use(express.json());

app.get("/", (req, res) => {
  res.send("API Gateway is running");
});

app.listen(PORT, () => {
  console.log(`API Gateway is running on port ${PORT}`);
});
