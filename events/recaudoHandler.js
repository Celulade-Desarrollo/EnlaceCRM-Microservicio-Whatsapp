import { formatearFecha } from "../utils/formatearFecha.js";
import { formatearDinero } from "../utils/formatearDinero.js";

export async function recaudoHandler(client, msg, texto) {
  const regex = /^recaudo\s+(\d{10})$/i;
  const match = texto.match(regex);

  if (!match) return false; // no coincide, continúa a otros handlers

  const numero = match[1];


  try {
    const res = await fetch(`http://localhost:3000/api/recaudo/${numero}`);
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      const total = data.reduce((acc, m) => acc + Number(m.Monto || 0), 0);

      const resumen =
`*Resumen del recaudo de hoy*

Movimientos encontrados: ${data.length}
Total recaudado: *$${formatearDinero(total)}*`;

      await client.sendMessage(msg.from, resumen, { sendSeen: false });

      for (const mov of data) {
        const mensaje =
`*Movimiento*

 *Fecha:* ${formatearFecha(mov.FechaHoraMovimiento)}
 *Monto:* $${formatearDinero(mov.Monto)}
 *Factura:* ${mov.NroFacturaAlpina}`;

        await client.sendMessage(msg.from, mensaje, { sendSeen: false });
      }
    } else {
      await client.sendMessage(msg.from, "No se encontraron movimientos para este número.", { sendSeen: false });
    }
  } catch (err) {
    console.error(err);
    await client.sendMessage(msg.from, "Error consultando el backend.", { sendSeen: false });
  }

  return true;
}
