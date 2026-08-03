import express from "express";
import dotenv from 'dotenv';

import { siHandlerMeta } from "./meta/events/siHandlerMeta.js";
import { diaHabilMessage } from "./meta/events/diahabilMessage.js";
import { notifyMetaEvent } from "./services/notificationService.js";

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


app.post("/webhook", async (req, res) => {
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
        console.log("de:", from);

        // Logica para controlar la respuesta del SI
        if(msg.button.text.toLowerCase() === "si"){
              const customer_name = await siHandlerMeta(from);
              await diaHabilMessage(from, customer_name);
        }
      }
    }


    if (value.statuses) {
      const status = value.statuses[0];
      
      if (status.status === 'failed') {
        console.error("Error al enviar el mensaje:");
        console.error(`- ID del mensaje: ${status.id}`);
        console.error(`- Destinatario: ${status.recipient_id}`);
        
        let errorMessage = '';
        if (status.errors && status.errors.length > 0) {
          status.errors.forEach(error => {
            console.error(`- Código de error: ${error.code}`);
            console.error(`- Título: ${error.title}`);
            console.error(`- Mensaje: ${error.message}`);
            errorMessage += `${error.code}: ${error.title}. `;
            if (error.error_data && error.error_data.details) {
              console.error(`- Detalles: ${error.error_data.details}`);
            }
          });
        }

        // Notificar a los supervisores sobre el fallo
        notifyMetaEvent({
          eventType: 'Error de Envío (Meta)',
          recipientNumber: status.recipient_id,
          success: false,
          details: { error: errorMessage.trim() || 'Error desconocido' }
        });
      } else {
        console.log(`Status del mensaje (${status.status}):`, status.id);
      }
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
