const makeWASocket = require('@whiskeysockets/baileys').default;
const {
  useMultiFileAuthState,
  DisconnectReason
} = require('@whiskeysockets/baileys');

const { Boom } = require('@hapi/boom');
const qrcode = require('qrcode-terminal');
const pino = require('pino');

const { handleCommand } = require('./commands');
const { checkTriggers } = require('./triggers');

async function startBot() {
  const { state, saveCreds } =
    await useMultiFileAuthState('./auth_info_baileys');

  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log(qr);
    }

    if (connection === 'open') {
      console.log('✅ WhatsApp bot connected!');
    }

    if (connection === 'close') {
      const statusCode =
        new Boom(lastDisconnect?.error)?.output?.statusCode;

      const shouldReconnect =
        statusCode !== DisconnectReason.loggedOut;

      console.log('❌ Connection closed.');
      console.log('🔄 Reconnecting:', shouldReconnect);

      if (shouldReconnect) {
        startBot();
      } else {
        console.log('🔐 Logged out. Delete auth_info_baileys and scan again.');
      }
    }
  });

  sock.ev.on('messages.upsert', async ({ messages }) => {
    for (const msg of messages) {
      if (!msg.message) continue;
      if (msg.key.fromMe) continue;

      const jid = msg.key.remoteJid;

      // Ignore groups
      if (jid.endsWith('@g.us')) {
        console.log('↳ Ignored group message.');
        continue;
      }

      const text =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        '';

      const cleanText = text.trim();

      if (!cleanText) continue;

      console.log(`📩 Personal message from ${jid}: "${cleanText}"`);

      try {
        if (cleanText.startsWith('!')) {
          await handleCommand(
            {
              body: cleanText,
              from: jid,
              reply: async (text) => {
                await sock.sendMessage(jid, { text });
              }
            },
            cleanText
          );
        } else {
          await checkTriggers(
            {
              body: cleanText,
              from: jid,
              reply: async (text) => {
                await sock.sendMessage(jid, { text });
              }
            },
            cleanText
          );
        }
      } catch (err) {
        console.error('❌ Error handling message:', err);
      }
    }
  });
}

startBot().catch((err) => {
  console.error('💥 Fatal error:', err);
});
