import axios from "axios";
export async function truoraLinkHandler(customer_number) {
    try {
        const url = "https://graph.facebook.com/v22.0/886055411262119/messages";

        const body = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: customer_number,
            type: "template",
            template: {
            name: "truora",
            language: {
            code: "en",
            policy: "deterministic",
            }
        }};


    const headers = {
      Authorization: `Bearer ${process.env.META_API_KEY}`,
      "Content-Type": "application/json",
    };

    const response = await axios.post(url, body, { headers });
    console.log(response)

    }catch (err) {
        console.error("Error enviando mensaje:", err.response?.data || err.message);
    }

}