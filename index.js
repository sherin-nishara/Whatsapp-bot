const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { handleCommand } = require('./commands');
const { checkTriggers } = require('./triggers');

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
    ],
  },
});

client.on('qr', (qr) => {
  console.log('📱 Scan this QR code:');
  qrcode.generate(qr, { small: true });
});

client.on('authenticated', () => {
  console.log('🔐 Authenticated');
});

client.on('ready', async () => {
  console.log('✅ Bot is online and connected to WhatsApp!');

  try {
    console.log('📡 WhatsApp state:', await client.getState());
  } catch (err) {
    console.error('State check failed:', err);
  }
});

client.on('change_state', (state) => {
  console.log('🔄 WhatsApp state changed:', state);
});

client.on('message_create', async (msg) => {
  console.log('🟡 MESSAGE_CREATE:', {
    from: msg.from,
    body: msg.body,
    type: msg.type,
    fromMe: msg.fromMe
  });
});

client.on('message_ciphertext', (msg) => {
  console.log('🔴 CIPHERTEXT MESSAGE:', {
    from: msg.from,
    type: msg.type
  });
});

client.on('message', async (msg) => {
  console.log('🟢 MESSAGE EVENT:', {
    from: msg.from,
    body: msg.body,
    type: msg.type
  });

  if (msg.from.endsWith('@g.us')) {
    console.log('↳ Ignored group message.');
    return;
  }

  const text = msg.body.trim();

  if (!text) return;

  console.log(`📩 Personal message from ${msg.from}: "${text}"`);

  try {
    if (text.startsWith('!')) {
      await handleCommand(msg, text);
    } else {
      await checkTriggers(msg, text);
    }
  } catch (err) {
    console.error('❌ Error handling message:', err);
  }
});

client.initialize();
