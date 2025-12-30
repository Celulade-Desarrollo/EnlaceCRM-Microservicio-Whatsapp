import express from "express";
import dotenv from 'dotenv';

import { siHandlerMeta } from "./meta/events/siHandlerMeta.js";
import { diaHabilMessage } from "./meta/events/diahabilMessage.js";


const app = express();
app.use(express.json());
dotenv.config();

const VERIFY_TOKEN = "enlaceCRM2025_whatsappservice";


app.get("/", (req, res) => {
  res.send("Servidor de Webhook activo");
});


app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("Webhook verificado correctamente");
    return res.status(200).send(challenge);
  } else {
    return res.sendStatus(403);
  }
});


app.post("/webhook", (req, res) => {
  try {
    const entry = req.body.entry?.[0];

    if (!entry) {
      console.log("Entrada vacía");
      return res.sendStatus(200);
    }

    const changes = entry.changes?.[0];
    const value = changes?.value;
    const messages = value?.messages;

 
    if (messages && messages.length > 0) {
      const msg = messages[0];
      const from = msg.from; 

      if (msg.type === "button" && msg.button) {
        console.log("texto del botón:", msg.button.text);
        console.log("de:", from)

        // Logica para controlar la respuesta del SI
        if(msg.button.text.toLowerCase() === "si"){
              const customer_name = siHandlerMeta(from);
              diaHabilMessage(from, customer_name);
        }
    }
}

    if (value.statuses) {
      console.log("Status del mensaje:", value.statuses[0]);
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("Error procesando webhook:", error);
    res.sendStatus(500);
  }
});

app.listen(5000, () => {
  console.log("Webhook ejecutándose en http://localhost:5000");
});
