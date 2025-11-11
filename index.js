import express from "express";

const app = express();
const PORT = 6000;

app.get("/", (req, res) => {
  res.send("Whatsapp");
});

app.listen(PORT, () => {
  console.log(`Microservicio Whatsapp provider is running on http://localhost:${PORT}`);
});