require("dotenv").config();
const { Client, Collection, Events, GatewayIntentBits, Partials, EmbedBuilder } = require("discord.js");
const client = new Client({
  intents: [GatewayIntentBits.AutoModerationConfiguration, GatewayIntentBits.AutoModerationExecution, GatewayIntentBits.DirectMessageReactions, GatewayIntentBits.DirectMessageTyping, GatewayIntentBits.DirectMessages, GatewayIntentBits.GuildEmojisAndStickers, GatewayIntentBits.GuildIntegrations, GatewayIntentBits.GuildInvites, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.GuildMessageTyping, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildModeration, GatewayIntentBits.GuildPresences, GatewayIntentBits.GuildScheduledEvents, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildWebhooks, GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent],
  partials: [Partials.Message, Partials.Channel, Partials.GuildMember, Partials.Reaction, Partials.GuildScheduledEvent, Partials.User, Partials.ThreadMember],
  shards: "auto"
});
const config = require("./config.js");
const { ERR_WEB } = config;
const path = require("path");
const moment = require("moment");
const { readdirSync } = require("fs");
const { handleErrors } = require('./handlers/errorHandler.js');

let token = config.token;

client.commandAliases = new Collection();
client.commands = new Collection();
client.slashCommands = new Collection();
client.slashDatas = [];



function log(message) {
  console.log(`[${moment().format("DD-MM-YYYY HH:mm:ss")}] ${message}`);

};
client.log = log

handleErrors(client, ERR_WEB); // Change the webhook url at env



// Prefix Command Handler
readdirSync(path.join(__dirname, "commands/prefix")).forEach((folder) => {
  readdirSync(path.join(__dirname, "commands/prefix", folder)).forEach((file) => {
    const command = require(path.join(__dirname, "commands/prefix", folder, file));
    if (command) {
      client.commands.set(command.name, command);
      if (command.aliases && Array.isArray(command.aliases)) {
        command.aliases.forEach((alias) => {
          client.commandAliases.set(alias, command.name);
        });
      }
    }
  });
});

// Slash Command Handler
readdirSync(path.join(__dirname, "commands/slash")).forEach((folder) => {
  readdirSync(path.join(__dirname, "commands/slash", folder)).forEach((file) => {
    const command = require(path.join(__dirname, "commands/slash", folder, file));
    client.slashDatas.push(command.data.toJSON());
    client.slashCommands.set(command.data.name, command);
  });
});

// Event Handler
readdirSync(path.join(__dirname, "events")).forEach((file) => {
  const event = require(path.join(__dirname, "events", file));
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
});

// Process Listeners
process.on("unhandledRejection", (e) => {
  console.log(e);
});
process.on("uncaughtException", (e) => {
  console.log(e);
});
process.on("uncaughtExceptionMonitor", (e) => {
  console.log(e);
});



client.login(token); // Change the token at env