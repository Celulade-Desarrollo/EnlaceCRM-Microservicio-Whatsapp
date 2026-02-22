import { formatearFecha } from "../utils/formatearFecha.js";
import { formatearDinero } from "../utils/formatearDinero.js";

export async function recaudoHandler(client, msg, texto, { number }) {
  const regex = /^recaudo\s+(\d{10})$/i;
  const match = texto.match(regex);

  if (!match) return false; // no coincide, continúa a otros handlers

  const numero = match[1];

  try {
    const res = await fetch(`http://localhost:2000/api/recaudo/${numero}`);
    const data = await res.json();

    if (Array.isArray(data) && data.length > 0) {
      const total = data.reduce((acc, m) => acc + Number(m.Monto || 0), 0);

      await client.reply(msg,
`*Resumen del recaudo de hoy*

Movimientos encontrados: ${data.length}
Total recaudado: *$${formatearDinero(total)}*`
      );

      for (const mov of data) {
        await client.reply(msg,
`*Movimiento*

*Fecha:* ${formatearFecha(mov.FechaHoraMovimiento)}
*Monto:* $${formatearDinero(mov.Monto)}
*Factura:* ${mov.NroFacturaAlpina}`
        );

        await new Promise(r => setTimeout(r, 500)); // pausa entre mensajes
      }
    } else {
      await client.reply(msg, "No se encontraron movimientos para este número.");
    }
  } catch (err) {
    console.error(err);
    await client.reply(msg, "Error consultando el backend.");
  }

  return true;
}