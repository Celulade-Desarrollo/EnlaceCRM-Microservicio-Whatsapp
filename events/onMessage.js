import { recaudoHandler } from "./recaudoHandler.js";
import { siHandler } from "./siHandler.js";

export async function onMessage(client, msg) {
  const texto = msg.body.trim().toLowerCase();

  if (await siHandler(client, msg, texto)) return;
  if (await recaudoHandler(client, msg, texto)) return;

  
}
