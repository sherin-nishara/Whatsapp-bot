// commands.js — all your "!command" replies live here.
// To add a new command later: add one line to the `commands` object below.

const commands = {
  '!ping': async (msg) => {
    await msg.reply('pong 🏓');
  },

  '!help': async (msg) => {
    const list = Object.keys(commands).join('\n');
    await msg.reply(`Available commands:\n${list}`);
  },

  // Example placeholders — replace the text with your real links whenever you're ready.
  '!resume': async (msg) => {
    await msg.reply('my resume: https://drive.google.com/drive/folders/1zNIb-O7pztRf7eeIzCDUK5SeShIZ31I3?usp=sharing');
  },

  // '!portfolio': async (msg) => {
  //   await msg.reply('💼 Check out my portfolio: https://your-link-here.com/portfolio');
  // },
};
async function handleCommand(msg, text) {
  const command = text.split(' ')[0].toLowerCase();
 
  // !help is handled right here instead of being a separate commands entry
  if (command === '!help') {
    const list = Object.keys(commands).join('\n');
    await msg.reply(`Available commands:\n!help\n${list}`);
    return;
  }
 
  if (commands[command]) {
    await commands[command](msg);
  } else {
    await msg.reply(`Unknown command "${command}". Type !help to see what I can do.`);
  }
}
module.exports = { handleCommand };
