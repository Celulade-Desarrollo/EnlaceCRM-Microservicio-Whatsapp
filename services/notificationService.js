import dotenv from 'dotenv';
dotenv.config();

let waClientInstance = null;

/**
 * Configura la instancia activa del cliente de WhatsApp (Baileys)
 * @param {Object} client Instancia de WhatsAppClient
 */
export function setWhatsAppClient(client) {
  waClientInstance = client;
}

/**
 * Obtiene y limpia la lista de números de teléfono configurados para notificaciones.
 * Lee desde la variable de entorno NOTIFICATION_NUMBERS (separados por coma).
 * @returns {Array<string>} Lista de números formateados
 */
export function getNotificationNumbers() {
  const envNumbers = process.env.NOTIFICATION_NUMBERS || '';
  if (!envNumbers.trim()) return [];

  return envNumbers
    .split(',')
    .map((num) => num.trim().replace(/\D/g, ''))
    .filter((num) => num.length > 0);
}

/**
 * Formatea la fecha actual en un string legible
 * @returns {string} Fecha y hora formateada
 */
function getFormattedTimestamp() {
  const now = new Date();
  return now.toLocaleString('es-CO', {
    timeZone: 'America/Bogota',
    dateStyle: 'short',
    timeStyle: 'medium',
  });
}

/**
 * Envía una notificación formateada a todo el grupo de supervisores configurados.
 * 
 * @param {Object} eventData Datos del evento Meta
 * @param {string} eventData.eventType Tipo de evento/mensaje (ej: "Truora Link", "Cupo Enlace", etc.)
 * @param {string} eventData.recipientNumber Número del cliente receptor
 * @param {string} [eventData.recipientName] Nombre del cliente receptor
 * @param {boolean} [eventData.success=true] Si el envío fue exitoso o falló
 * @param {Object} [eventData.details] Información adicional (monto, email, error, etc.)
 */
export async function notifyMetaEvent({
  eventType,
  recipientNumber,
  recipientName = 'No especificado',
  success = true,
  details = {},
}) {
  const numbers = getNotificationNumbers();

  if (numbers.length === 0) {
    console.log('[NOTIFIER] No hay números configurados en NOTIFICATION_NUMBERS.');
    return;
  }

  const cleanRecipientNum = recipientNumber ? recipientNumber.replace(/\D/g, '') : 'N/A';
  const statusEmoji = success ? '✅ Exitoso' : '❌ Fallido';
  const timestamp = getFormattedTimestamp();

  let message = `📢 *NOTIFICACIÓN EVENTO META*\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `📋 *Evento:* ${eventType}\n`;
  message += `👤 *Cliente:* ${recipientName}\n`;
  message += `📱 *Número:* +${cleanRecipientNum}\n`;
  message += `⚡ *Estado:* ${statusEmoji}\n`;

  if (details.amount) {
    message += `💰 *Monto:* ${details.amount}\n`;
  }
  if (details.email) {
    message += `📧 *Correo:* ${details.email}\n`;
  }
  if (!success && details.error) {
    message += `⚠️ *Detalle Error:* ${details.error}\n`;
  }

  message += `🕒 *Fecha:* ${timestamp}\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━`;

  await sendNotificationToGroup(numbers, message);
}

/**
 * Envía un mensaje directo a todo el grupo de notificaciones.
 * 
 * @param {Array<string>} numbers Lista de números
 * @param {string} message Texto del mensaje
 */
export async function sendNotificationToGroup(numbers, message) {
  if (!waClientInstance || !waClientInstance.isReady) {
    console.warn('[NOTIFIER] WhatsApp Client no está listo. No se enviará notificación por WhatsApp.');
    return;
  }

  for (const phone of numbers) {
    try {
      await waClientInstance.sendMessage(phone, message);
      console.log(`[NOTIFIER] Notificación enviada exitosamente a ${phone}`);
    } catch (err) {
      console.error(`[NOTIFIER] Error enviando notificación a ${phone}:`, err.message);
    }
  }
}

export default {
  setWhatsAppClient,
  getNotificationNumbers,
  notifyMetaEvent,
  sendNotificationToGroup,
};
