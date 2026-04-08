const { Collection } = require("discord.js");
const config = require("../config.js");

const cooldown = new Collection();

module.exports = async (interaction) => {
  if (interaction.user.bot) return;

  const client = interaction.client;
  
  // Handle slash commands
  if (interaction.isChatInputCommand()) {
    const command = client.slashCommands.get(interaction.commandName);
    if (!command) return;

    // Owner-only check
    if (command.ownerOnly && !config.owner.includes(interaction.user.id)) {
      return interaction.reply({ content: "this command for owner only.", flags: 64 });
    }

    // Cooldown system
    if (command.cooldown) {
      const cooldownKey = `${command.data.name}-${interaction.user.id}`;
      if (cooldown.has(cooldownKey)) {
        const waited = cooldown.get(cooldownKey) - Date.now();
        if (waited > 0) {
          return interaction.reply({
            content: `Cooldown <t:${Math.floor((Date.now() + waited) / 1000)}:R> bentar ya.`,
            flags: 64,
          }).then((msg) => setTimeout(() => msg.delete(), waited + 1000));
        }
      }

      // Check if it's a hybrid command (has execute)
      if (command.execute) {
        await command.execute(interaction, client);
      } 
      // Fallback to regular run for legacy commands
      else if (command.run) {
        await command.run(client, interaction);
      }
      
      cooldown.set(cooldownKey, Date.now() + command.cooldown);
      setTimeout(() => cooldown.delete(cooldownKey), command.cooldown);
    } else {
      if (command.execute) {
        await command.execute(interaction, client);
      } else if (command.run) {
        await command.run(client, interaction);
      }
    }
  }
  
  // You can add other interaction types here (buttons, select menus, etc.)
};