import pkg from "whatsapp-web.js";
const { Client, LocalAuth } = pkg;
import qrcode from "qrcode-terminal";

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  },
});

client.on("qr", (qr) => {
  console.log("QR WhatsApp:");
  qrcode.generate(qr, { small: true });
});

client.on("message", async (msg) => {
  const texto = msg.body.trim().toLocaleLowerCase();

  const regex = "recaudo"
  const match = texto.match(regex);

  if (!match) return;

  const uuid = match[1];

  try {
    const res = await fetch(`http://localhost:4123/api/coordinator`);
    const backendMessage = await res.text();
    await client.sendMessage(msg.from, backendMessage);
  } catch (e) {
    await client.sendMessage(msg.from, "Error consultando el backend.");
  }
});


client.on("ready", () => {
  console.log("Cliente de WhatsApp listo");
});

client.initialize();

export const sendMessage = async (number, infomessage) => {
  const chatId = number + "@c.us";
  const message = infomessage;
  await client.sendMessage(chatId, message);
};
