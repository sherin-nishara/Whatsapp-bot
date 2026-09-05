// index.js — main bot file
// Connects WhatsApp and routes personal-chat messages
// to commands.js or triggers.js.

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

  webVersionCache: {
    type: 'remote',
    remotePath:
      'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.3000.1023940520.html',
  },
});

// WhatsApp asks for login
client.on('qr', (qr) => {
  console.log('📱 Scan this QR code:');

  qrcode.generate(qr, { small: true });

  console.log('\nRAW_QR_DATA:');
  console.log(qr);
});

// Login successful
client.on('ready', () => {
  console.log('✅ Bot is online and connected to WhatsApp!');
});

// Ignore group chats and handle personal chats only
client.on('message', async (msg) => {

  // Ignore WhatsApp groups
  if (msg.from.endsWith('@g.us')) {
    console.log('↳ Ignored group message.');
    return;
  }

  const text = msg.body.trim();

  // Ignore empty/non-text messages
  if (!text) {
    return;
  }

  console.log(`📩 Personal message from ${msg.from}: "${text}"`);

  try {
    if (text.startsWith('!')) {
      // Commands: !ping, !resume, etc.
      await handleCommand(msg, text);
    } else {
      // Normal messages: hi, hello, etc.
      await checkTriggers(msg, text);
    }
  } catch (err) {
    console.error('❌ Error handling message:', err);
  }
});

client.initialize();
