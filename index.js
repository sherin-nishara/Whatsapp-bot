// index.js — main bot file
// This starts the WhatsApp connection, shows the QR code to scan,
// and routes every incoming message to either commands.js or triggers.js

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { handleCommand } = require('./commands');
const { checkTriggers } = require('./triggers');

// LocalAuth saves your login session to disk (./.wwebjs_auth)
// so you only need to scan the QR code ONCE, not every restart.
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  },
  webVersionCache: {
    type: 'remote',
    remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.3000.1023940520.html',
  },
});

// Fires when WhatsApp needs you to log in — prints a QR code in the terminal.
client.on('qr', (qr) => {
  console.log('Scan this QR code with WhatsApp (Linked Devices):');
  qrcode.generate(qr, { small: true });
});

// Fires once login succeeds.
client.on('ready', () => {
  console.log('✅ Bot is online and connected to WhatsApp!');
});

// Fires on EVERY incoming message.
client.on('message', async (msg) => {
  const text = msg.body.trim();

  console.log(`Message from ${msg.from}: ${text}`);

  if (text.startsWith('!')) {
    // It's a command like "!ping" or "!resume"
    await handleCommand(msg, text);
  } else {
    // Not a command — check if it contains a trigger word like "hi"
    await checkTriggers(msg, text);
  }
});

client.initialize();
