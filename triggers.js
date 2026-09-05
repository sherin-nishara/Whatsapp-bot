// triggers.js
const TRIGGER_WORDS = [
  'hi',
  'hey',
  'hello',
  'yt',
  'ping',
  'you there',
  'got a sec',
  'you got a sec',
  'quick question',
  'are you around',
  'you around',
];

const TRIGGER_REPLY = 'https://nohello.net';

// Max number of words a message can have to still count as a "just saying hi" message.
const MAX_WORDS = 3;
 
async function checkTriggers(msg, text) {
  const lowerText = text.toLowerCase().trim();
  const wordCount = lowerText.split(/\s+/).length;
 
  const isJustGreeting =
    wordCount < MAX_WORDS &&
    TRIGGER_WORDS.some((word) => lowerText.includes(word));
 
  if (isJustGreeting) {
    await msg.reply(TRIGGER_REPLY);
  }
}

module.exports = { checkTriggers };