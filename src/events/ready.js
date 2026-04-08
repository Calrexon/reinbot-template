const { Events, ActivityType } = require("discord.js");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v10");

function validateSlashCommands(slashDatas) {
  for (const cmd of slashDatas) {
    if (!cmd.options) continue;

    const options = cmd.options;
    let seenOptional = false;

    for (let i = 0; i < options.length; i++) {
      const opt = options[i];

      if (opt.required === false) seenOptional = true;
      if (opt.required === true && seenOptional) {
        console.warn(`⚠️ [WARNING] Command "${cmd.name}" has a required option after an optional one. This will cause a Discord API error.`);
        console.warn(`   -> Fix the order of options in "${cmd.name}"`);
        break;
      }

      // Cek subcommand option juga (opsional, tapi bagus kalau ada)
      if (opt.options && Array.isArray(opt.options)) {
        let subSeenOptional = false;
        for (const sub of opt.options) {
          if (sub.required === false) subSeenOptional = true;
          if (sub.required === true && subSeenOptional) {
            console.warn(`⚠️ [WARNING] Command "${cmd.name}" (sub-option "${opt.name}") has required option after optional.`);
            break;
          }
        }
      }
    }
  }
}

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute: async (client) => {
    const rest = new REST({ version: "10" }).setToken(client.token);

    const setBotPresence = () => {
      try {
        client.user.setPresence({
          status: "online",
          activities: [{
            type: ActivityType.Custom,
            name: "TorangPunya.ID",
            state: "TorangPunya -use /help or t?help"
          }],
        });
      } catch (error) {
        console.error("Error setting presence:", error);
      }

      setTimeout(setBotPresence, 30 * 60 * 1000); // every 30 minutes
    };

    setBotPresence();
    

    client.log(`${client.user.username} Bot Telah Aktif!`);

    // Cek urutan required/optional
    validateSlashCommands(client.slashDatas);

    try {
      await rest.put(
        Routes.applicationCommands(client.user.id),
        { body: client.slashDatas }
      );
      console.log("✅ Global slash commands registered successfully!");
    } catch (error) {
      console.error("❌ Error registering slash commands:", error);
    }
  },
};