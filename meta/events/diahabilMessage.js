import axios from "axios";
import { notifyMetaEvent } from "../../services/notificationService.js";

export async function diaHabilMessage(customer_number, customer_name) {
  try {
    const url = "https://graph.facebook.com/v22.0/886055411262119/messages";

    const body = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: customer_number,
      type: "template",
      template: {
        name: "diahabilcupo",
        language: {
          code: "en",
        },
        components: [
          {
            type: "body",
            parameters: [
              {
                type: "text",
                text: customer_name,
              }
            ],
          },
        ],
      },
    };

    const headers = {
      Authorization: `Bearer ${process.env.META_API_KEY}`,
      "Content-Type": "application/json",
    };

    const response = await axios.post(url, body, { headers });
    console.log("Mensaje enviado:", response.data);

    notifyMetaEvent({
      eventType: "Día Hábil Cupo",
      recipientNumber: customer_number,
      recipientName: customer_name,
      success: true,
    }).catch((e) => console.error("[NOTIFIER] Error:", e.message));

  } catch (err) {
    const errorMsg = err.response?.data?.error?.message || err.message;
    console.error("Error enviando mensaje:", err.response?.data || err.message);

    notifyMetaEvent({
      eventType: "Día Hábil Cupo",
      recipientNumber: customer_number,
      recipientName: customer_name,
      success: false,
      details: { error: errorMsg },
    }).catch((e) => console.error("[NOTIFIER] Error:", e.message));

    throw err;
  }
}

