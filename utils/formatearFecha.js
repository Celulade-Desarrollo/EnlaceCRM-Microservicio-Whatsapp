export function formatearFecha(isoString) {
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
