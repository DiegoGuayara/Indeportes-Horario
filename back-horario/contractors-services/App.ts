import express from "express";

const app = express();
const PORT = process.env.PORT || 10114;

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Contractors Services is running");
});

app.listen(PORT, () => {
  console.log(`Contractors Services is running on port ${PORT}`);
});
