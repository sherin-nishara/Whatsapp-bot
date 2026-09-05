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
    // These flags help Puppeteer/Chromium run on servers (like Railway)
    // that don't have a full desktop environment.
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  },
});

// Fires when WhatsApp needs you to log in — prints a QR code in the terminal.
client.on('qr', (qr) => {
  console.log('Scan this QR code with WhatsApp (Linked Devices):');
  qrcode.generate(qr, { small: true });

  // Railway's log viewer can distort the ASCII QR above.
  // If it won't scan, copy the RAW_QR_DATA line below and paste it into:
  // https://www.qr-code-generator.com/  (or any free QR generator)
  // to get a clean scannable image instead.
  console.log('RAW_QR_DATA (paste into a QR generator site if the ASCII above won\'t scan):');
  console.log(qr);
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
