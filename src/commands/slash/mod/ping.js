const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Cek latency bot"),

    cooldown: 3000,
    ownerOnly: false,

    run: async (client, interaction) => {
        const before = Date.now();
        await interaction.deferReply();
        const after = Date.now();

        const embed = new EmbedBuilder()
            .setColor("#9b59ff")
            .setTitle("🏓 Pong!")
            .addFields(
                { name: "📡 Message Latency", value: `\`${after - before}ms\``, inline: true },
                { name: "💓 API Latency",     value: `\`${Math.round(client.ws.ping)}ms\``, inline: true },
            )
            .setFooter({ text: interaction.user.username, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    },
};