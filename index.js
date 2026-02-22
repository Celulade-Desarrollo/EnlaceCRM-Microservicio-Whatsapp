import express from 'express';
import cors from 'cors';
import WhatsAppClient from './events/WhatsAppClient.js';
import { authMiddleware } from './token.js';
import { truoraLinkHandler } from './meta/events/truoraLinkHandler.js';
import { cupoEnlaceHandler } from './meta/events/cupoMessage.js';
import { cupoActivo } from './meta/events/cupoActivo.js';
import { firmaDigitalMessage } from './meta/events/firmaDigitalMessage.js';
import { recaudoHandler } from './events/recaudoHandler.js';

const PORT = process.env.PORT || 6000;
const app = express();

// ─── MIDDLEWARES ──────────────────────────────────────────────────────────────

app.use(cors());
app.use(express.json());

// ─── WHATSAPP CLIENT ──────────────────────────────────────────────────────────

const wa = new WhatsAppClient();

// Recaudo funcion para el transportista 
wa.onMessage(recaudoHandler);
let starting = true;

wa.init()
  .then(() => { starting = false; })
  .catch((err) => {
    console.error('[SERVER] Error iniciando WhatsApp:', err.message);
    process.exit(1);
  });

function requireReady(req, res, next) {
  if (starting) return res.status(503).json({ ok: false, error: 'WhatsApp aún está iniciando, espera el QR y vuelve a intentar.' });
  if (!wa.isReady) return res.status(503).json({ ok: false, error: 'WhatsApp no está conectado.' });
  next();
}

// ─── ENDPOINTS BASE ───────────────────────────────────────────────────────────

app.get('/', authMiddleware, (req, res) => {
  res.send('Servidor WhatsApp microserver activo');
});

app.get('/status', (req, res) => {
  res.json({ ok: true, ready: wa.isReady, starting });
});

// ─── SEND MESSAGE GENÉRICO ────────────────────────────────────────────────────

// POST /send-message  { "number": "573001234567", "message": "Hola!" }
app.post('/send-message', requireReady, async (req, res) => {
  const { number, message } = req.body;

  if (!number || !message) {
    return res.status(400).json({ error: 'Faltan campos: number y message' });
  }

  try {
    await wa.sendMessage(number, message);
    res.status(200).json({ success: true, message: 'Mensaje enviado correctamente' });
  } catch (err) {
    console.error('Error enviando mensaje:', err);
    res.status(500).json({ success: false, error: 'Error enviando mensaje' });
  }
});

// ─── ENDPOINTS META ───────────────────────────────────────────────────────────

app.post('/meta/truora-link/:number/:name', requireReady, async (req, res) => {
  const { number, name } = req.params;

  if (!number) return res.status(400).json({ error: 'Falta el campo: number' });

  try {
    await truoraLinkHandler(`57${number}`, name);
    res.status(200).json({ success: true, message: 'Mensaje Truora enviado correctamente' });
  } catch (err) {
    console.error('Error enviando mensaje Truora:', err);
    res.status(500).json({ success: false, error: 'Error enviando mensaje Truora' });
  }
});

app.post('/meta/cupo/:number/:name/:amount', requireReady, async (req, res) => {
  const { number, name, amount } = req.params;

  if (!number) return res.status(400).json({ error: 'Falta el campo: number' });

  try {
    await cupoEnlaceHandler(`57${number}`, name, amount);
    res.status(200).json({ success: true, message: 'Mensaje Cupo enviado correctamente' });
  } catch (err) {
    console.error('Error enviando mensaje Cupo:', err);
    res.status(500).json({ success: false, error: 'Error enviando mensaje Cupo' });
  }
});

app.post('/meta/cupo-activo/:number/:name', requireReady, async (req, res) => {
  const { number, name } = req.params;

  if (!number) return res.status(400).json({ error: 'Falta el campo: number' });

  try {
    await cupoActivo(`57${number}`, name);
    res.status(200).json({ success: true, message: 'Mensaje Cupo Activo enviado correctamente' });
  } catch (err) {
    console.error('Error enviando mensaje Cupo Activo:', err);
    res.status(500).json({ success: false, error: 'Error enviando mensaje Cupo Activo' });
  }
});

app.post('/meta/firma-digital/:number/:name/:email', requireReady, async (req, res) => {
  const { number, name, email } = req.params;

  if (!number) return res.status(400).json({ error: 'Falta el campo: number' });

  try {
    await firmaDigitalMessage(`57${number}`, name, email);
    res.status(200).json({ success: true, message: 'Mensaje Firma Digital enviado correctamente' });
  } catch (err) {
    console.error('Error enviando mensaje Firma Digital:', err);
    res.status(500).json({ success: false, error: 'Error enviando mensaje Firma Digital' });
  }
});

// ─── START ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`[SERVER] Corriendo en http://localhost:${PORT}`);
});