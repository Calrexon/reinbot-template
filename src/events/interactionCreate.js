const { Events } = require("discord.js");
const commandHandler = require("../handlers/commandHandler");
const config = require("../config");

module.exports = {
  name: Events.InteractionCreate,
  execute: async (interaction) => {

    try {
      if (interaction.isCommand()) return commandHandler(interaction);
    } catch (error) {
      console.error("Interaction Error:", error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: "Terjadi error saat memproses interaksi.", flags: 64 });
      } else {
        await interaction.reply({ content: "Terjadi error saat memproses interaksi.", flags: 64 });
      }
    }
  },
};