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
    // These flags help Puppeteer/Chromium run reliably on low-memory
    // cloud containers (like Railway) that don't have a full desktop environment.
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',   // avoids crashes from Railway's small /dev/shm
      '--disable-gpu',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',          // reduces memory footprint significantly
    ],
  },
});

// Print a heartbeat every 30s so we can see in the logs whether the
// process is still alive and responsive, even if WhatsApp goes quiet.
setInterval(() => {
  console.log(`💓 Heartbeat: process alive at ${new Date().toISOString()}`);
}, 30000);

// Catch any low-level disconnect so we know WHY the session died.
client.on('disconnected', (reason) => {
  console.error('⚠️ Client was disconnected:', reason);
});

client.on('auth_failure', (msg) => {
  console.error('⚠️ Auth failure:', msg);
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
  // Ignore group chats — group IDs always end in "@g.us".
  // Personal chats end in "@c.us" or "@lid".
  if (msg.from.endsWith('@g.us')) {
    return;
  }

  const text = msg.body.trim();

  console.log(`Message from ${msg.from}: "${text}" | type: ${msg.type} | length: ${text.length}`);

  // Skip anything that isn't a normal text message (e.g. system notifications,
  // "you linked a device" events, protocol messages with no real content).
  if (msg.type !== 'chat' || text.length === 0) {
    console.log('↳ Skipping: not a normal text message.');
    return;
  }

  try {
    if (text.startsWith('!')) {
      // It's a command like "!ping" or "!resume"
      await handleCommand(msg, text);
    } else {
      // Not a command — check if it contains a trigger word like "hi"
      await checkTriggers(msg, text);
    }
  } catch (err) {
    console.error('❌ Error handling message:', err);
  }
});

client.initialize();
                          
