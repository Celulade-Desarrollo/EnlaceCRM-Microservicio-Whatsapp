import pkg from "whatsapp-web.js";
const { Client, LocalAuth, Contact } = pkg;
import qrcode from "qrcode-terminal";


function formatearFecha(isoString) {
  const fecha = new Date(isoString);

  
  const fechaStr = fecha.toLocaleDateString("es-CO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "UTC" 
  });


  const horaStr = fecha.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC"
  });

  return `${fechaStr} ${horaStr} (UTC)`;
}


function formatearDinero(valor) {
  return Number(valor).toLocaleString("es-CO");
}

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
})


client.on("message", async (msg) => {

  const texto = msg.body.trim().toLocaleLowerCase();

  const regex = /^recaudo\s+(\d{10})$/i;
  const match = texto.match(regex);

  const numero = match ? match[1] : null;
  console.log(numero)

  if (!match) return;

  try {
    const res = await fetch(
      `http://localhost:2000/api/recaudo/${numero}`
    );
    const data = await res.json();

    if (Array.isArray(data) && data.length > 0) {
     
      const total = data.reduce((acc, m) => acc + Number(m.Monto || 0), 0);


      const resumen =
`*Resumen del recaudo de hoy*

Movimientos encontrados: ${data.length}
Total recaudado: *$${formatearDinero(total)}*`;

      await client.sendMessage(msg.from, resumen);


      for (const mov of data) {
        const mensaje =
`*Movimiento*

 *Fecha:* ${formatearFecha(mov.FechaHoraMovimiento)}
 *Monto:* $${formatearDinero(mov.Monto)}
 *Factura:* ${mov.NroFacturaAlpina}`;

        await client.sendMessage(msg.from, mensaje);
      }

    } else {
      await client.sendMessage(msg.from, "No se encontraron movimientos para este número.");
    }
  } catch (e) {
    console.error(e);
    await client.sendMessage(msg.from, "Error consultando el backend.");
  }
});

client.on("ready", () => {
  console.log("Cliente de WhatsApp listo");
});

client.initialize();

export const sendMessage = async (number, infomessage) => {
  const chatId = `57${number}` + "@c.us";
  const message = infomessage;
  await client.sendMessage(chatId, message);
};
