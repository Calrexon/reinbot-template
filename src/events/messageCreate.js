const { ChannelType, Collection, Events } = require("discord.js");
const config = require("../config");

const cooldown = new Collection();

// Helper function to escape regex

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    const client = message.client;
    if (message.author.bot) return;

  }
};


async function handlePrefixCommand(message, client) {
  const prefix = config.prefix;
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/g);
  const cmd = args.shift()?.toLowerCase();
  if (!cmd) return;

  const command = client.commands.get(cmd) || 
                 client.commands.get(client.commandAliases.get(cmd));
  if (!command) return;

  // Owner-only check
  if (command.ownerOnly && !config.owner.includes(message.author.id)) {
    return message.reply({ content: "This Command Only For Bot Developer." });
  }

  // Cooldown system
  const cooldownKey = `${command.prefixInfo?.name || command.name}-${message.author.id}`;
  const now = Date.now();

  if (command.cooldown) {
    const existing = cooldown.get(cooldownKey);
    if (existing && existing > now) {
      const remaining = existing - now;
      const reply = await message.reply({
        content: `<a:loading:1371341166460538950> cooldown... try again <t:${Math.floor((now + remaining) / 1000)}:R>.`
      });
      setTimeout(() => reply.delete(), remaining + 1000);
      return;
    }
  }

  try {
    // Execute the command
    if (command.messageRun) {
      await command.messageRun(message, args, client);
    } else if (command.run) {
      await command.run(client, message, args);
    }
    
    // Set cooldown if applicable
    if (command.cooldown) {
      cooldown.set(cooldownKey, now + command.cooldown);
      setTimeout(() => cooldown.delete(cooldownKey), command.cooldown);
    }
  } catch (err) {
    console.error(err);
    await message.reply("Something wrong when run the command <:pawmidk:1373598929371004979>.");
  }
}