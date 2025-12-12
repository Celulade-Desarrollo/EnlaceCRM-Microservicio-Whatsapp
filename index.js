import express from "express";
import cors from "cors";
import { sendMessage } from "./events/whatsapp.js";
import { authMiddleware } from "./token.js";
import { truoraLinkHandler } from "./meta/events/truoraLinkHandler.js";
import { cupoEnlaceHandler } from "./meta/events/cupoMessage.js";

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Endpoint base
app.get("/", authMiddleware, (req, res) => {
  res.send("Servidor Whatsapp microserver activo");
});

// Endpoint para enviar mensaje
app.post("/send-message", async (req, res) => {
  const { number, message } = req.body;

  if (!number || !message) {
    return res.status(400).json({ error: "Faltan campos: number y message" });
  }

  try {
    await sendMessage(number, message);
    res.status(200).json({ success: true, message: "Mensaje enviado correctamente" });
  } catch (err) {
    console.error("Error enviando mensaje:", err);
    res.status(500).json({ success: false, error: "Error enviando mensaje" });
  }
});


app.post("/meta/truora-link/:number/:name", async (req, res) => {
  const { number,name } = req.params;

  if (!number) {
    return res.status(400).json({ error: "Falta el campo: customer_number" });
  }

  try {
    const numWhitPrefix = `57${number}`;
    await truoraLinkHandler(numWhitPrefix, name);
    res.status(200).json({ success: true, message: "Mensaje Truora enviado correctamente" });
  } catch (err) {
    console.error("Error enviando mensaje Truora:", err);
    res.status(500).json({ success: false, error: "Error enviando mensaje Truora" });
  }
});


app.post("/meta/cupo/:number/:name/:amount", async (req, res) => {
  const { number,name,amount } = req.params;

  if (!number) {
    return res.status(400).json({ error: "Falta el campo: customer_number" });
  }

  try {
    const numWhitPrefix = `57${number}`;
    await cupoEnlaceHandler(numWhitPrefix, name, amount);
    res.status(200).json({ success: true, message: "Mensaje Cupo enviado correctamente" });
  } catch (err) {
    console.error("Error enviando mensaje Cupo:", err);
    res.status(500).json({ success: false, error: "Error enviando mensaje Cupo" });
  }

});


const PORT = 6000;
app.listen(PORT, () => console.log("Servidor Whatsapp en puerto " + PORT));
