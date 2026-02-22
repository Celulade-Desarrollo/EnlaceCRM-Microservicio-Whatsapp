import makeWASocket, { useMultiFileAuthState, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import qrcode from 'qrcode-terminal';
import pino from 'pino';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SESSION_DIR = path.join(process.cwd(), '.wa_session');
const FATAL_CODES = [401, 440, 500];

class WhatsAppClient {
  constructor(options = {}) {
    this.options = { sessionDir: options.sessionDir ?? SESSION_DIR };
    this.sock = null;
    this.isReady = false;
    this._readyResolve = null;
    this._readyReject = null;
    this._reconnecting = false;
    this._messageHandlers = [];
  }

  async init() {
    this._reconnecting = false;
    const { state, saveCreds } = await useMultiFileAuthState(this.options.sessionDir);
    const { version } = await fetchLatestBaileysVersion();

    console.log(`[WA] Usando Baileys v${version.join('.')}`);

    this.sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false,
      logger: pino({ level: 'silent' }),
      browser: ['Ubuntu Server', 'Chrome', '120.0'],
      syncFullHistory: false,
      markOnlineOnConnect: false,
    });

    this.sock.ev.on('creds.update', saveCreds);
    this.sock.ev.on('connection.update', (update) => this._handleConnectionUpdate(update));
    this._bindMessageListener();

    return new Promise((resolve, reject) => {
      this._readyResolve = resolve;
      this._readyReject = reject;
      setTimeout(() => {
        if (!this.isReady) reject(new Error('[WA] Timeout. Escaneaste el QR?'));
      }, 120_000);
    });
  }

  _bindMessageListener() {
    this.sock.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify') return;

      for (const msg of messages) {
        if (msg.key.fromMe || !msg.message) continue;

        const from    = msg.key.remoteJid;
        const number  = from.replace('@s.whatsapp.net', '').replace('@g.us', '');
        const isGroup = from.endsWith('@g.us');
        const texto   = this._extractText(msg);

        if (!texto) continue;

        console.log(`[WA] Mensaje de ${number}${isGroup ? ' (grupo)' : ''}: "${texto}"`);

        for (const handler of this._messageHandlers) {
          try {
            const handled = await handler(this, msg, texto, { from, number, isGroup });
            if (handled) break;
          } catch (err) {
            console.error(`[WA] Error en handler: ${err.message}`);
          }
        }
      }
    });
  }

  onMessage(handler) {
    this._messageHandlers.push(handler);
    return this;
  }

  _extractText(msg) {
    const m = msg.message;
    return (
      m?.conversation ||
      m?.extendedTextMessage?.text ||
      m?.imageMessage?.caption ||
      m?.videoMessage?.caption ||
      ''
    ).trim();
  }

  async sendMessage(phone, message) {
    if (!this.isReady) throw new Error('[WA] No conectado. Llama a init() primero.');
    const jid = phone.replace(/\D/g, '') + '@s.whatsapp.net';
    console.log(`[WA] Enviando a ${phone}...`);
    await this.sock.sendMessage(jid, { text: message });
    console.log(`[WA] Enviado a ${phone}`);
    return true;
  }

  async reply(msg, message) {
    const jid = msg.key.remoteJid;
    await this.sock.sendMessage(jid, { text: message });
  }

  async sendBulk(contacts, delayMs = 4000) {
    const results = [];
    for (const contact of contacts) {
      try {
        await this.sendMessage(contact.phone, contact.message);
        results.push({ phone: contact.phone, status: 'ok' });
      } catch (err) {
        console.error(`[WA] Error con ${contact.phone}: ${err.message}`);
        results.push({ phone: contact.phone, status: 'error', error: err.message });
      }
      if (delayMs > 0) await this._sleep(delayMs);
    }
    return results;
  }

  _handleConnectionUpdate(update) {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('\n[WA] Escanea este QR con WhatsApp desde tu telefono:\n');
      qrcode.generate(qr, { small: true });
      console.log('\nWhatsApp -> Dispositivos vinculados -> Vincular dispositivo\n');
    }

    if (connection === 'open') {
      console.log('[WA] Conectado.');
      this.isReady = true;
      if (this._readyResolve) {
        this._readyResolve();
        this._readyResolve = null;
        this._readyReject = null;
      }
    }

    if (connection === 'close') {
      const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
      this.isReady = false;

      if (FATAL_CODES.includes(reason)) {
        console.log(reason === 440
          ? '\n[WA] ERROR 440: Conflicto de sesion. Borra .wa_session/ y reconecta.\n'
          : `\n[WA] Sesion terminada (codigo ${reason}). Borra .wa_session/ y reconecta.\n`
        );
        try { this.sock?.end(); } catch {}
        process.exit(1);
      } else {
        console.log(`[WA] Desconexion temporal (${reason}). Reconectando en 3s...`);
        setTimeout(() => this._reconnect(), 3000);
      }
    }
  }

  async _reconnect() {
    if (this._reconnecting) return;
    this._reconnecting = true;
    try {
      const { state, saveCreds } = await useMultiFileAuthState(this.options.sessionDir);
      const { version } = await fetchLatestBaileysVersion();
      this.sock = makeWASocket({
        version, auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }),
        browser: ['Ubuntu Server', 'Chrome', '120.0'],
        syncFullHistory: false, markOnlineOnConnect: false,
      });
      this.sock.ev.on('creds.update', saveCreds);
      this.sock.ev.on('connection.update', (u) => this._handleConnectionUpdate(u));
      this._bindMessageListener();
    } finally {
      this._reconnecting = false;
    }
  }

  async close() {
    if (this.sock) {
      try { await this.sock.logout(); } catch {}
      this.sock = null;
      this.isReady = false;
    }
  }

  _sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
}

export default WhatsAppClient;