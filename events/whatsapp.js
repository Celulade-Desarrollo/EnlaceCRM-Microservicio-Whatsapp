import pkg from "whatsapp-web.js";
const { Client, LocalAuth } = pkg;

import qrcode from "qrcode-terminal";
import { onMessage } from "./onMessage.js";

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

client.on("ready", () => {
  console.log("Cliente de WhatsApp listo");
});

client.on("message", async (msg) => onMessage(client, msg));

client.initialize();

export const sendMessage = async (number, infomessage) => {
  const chatId = `${number}@c.us`;
  await client.sendMessage(chatId, infomessage);
};
