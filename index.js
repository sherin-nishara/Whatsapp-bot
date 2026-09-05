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
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
    ],
  },
});

client.on('qr', (qr) => {
  console.log(qr);
});

client.on('authenticated', () => {
  console.log('🔐 Authenticated');
});

client.on('ready', async () => {
  console.log('✅ Bot is online and connected!');

  try {
    console.log('📡 State:', await client.getState());
  } catch (err) {
    console.error('State error:', err);
  }
});

client.on('change_state', (state) => {
  console.log('🔄 State changed:', state);
});

client.on('message_create', (msg) => {
  console.log('🟡 MESSAGE_CREATE:', {
    from: msg.from,
    body: msg.body,
    type: msg.type,
    fromMe: msg.fromMe
  });
});

client.on('message_ciphertext', (msg) => {
  console.log('🔴 CIPHERTEXT:', {
    from: msg.from,
    type: msg.type
  });
});

client.on('message', async (msg) => {
  console.log('🟢 MESSAGE:', {
    from: msg.from,
    body: msg.body,
    type: msg.type
  });

  if (msg.from.endsWith('@g.us')) return;

  const text = msg.body.trim();

  if (!text) return;

  try {
    if (text.startsWith('!')) {
      await handleCommand(msg, text);
    } else {
      await checkTriggers(msg, text);
    }
  } catch (err) {
    console.error('❌ Handler error:', err);
  }
});

client.initialize();
