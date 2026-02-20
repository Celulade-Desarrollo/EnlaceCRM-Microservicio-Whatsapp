export async function siHandler(client, msg, texto) {
  
  const regex = /^\d{7,10}$/;

  if (!regex.test(texto)) return false;

  const cedula = texto;
  console.log("Cédula detectada:", cedula);

  try {
    const res = await fetch(`/api/flujoRegistroEnlace/${cedula}`);
    const data = await res.json();

    await client.sendMessage(msg.from, `Consulta realizada para la cédula *${cedula}*`, { sendSeen: false });
    await client.sendMessage(msg.from, JSON.stringify(data, null, 2), { sendSeen: false });

  } catch (err) {
    console.error(err);
    await client.sendMessage(msg.from, "Error al consultar la cédula.", { sendSeen: false });
  }

  return true;
}
