const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: "ping",
    aliases: ["latency", "pong"],
    cooldown: 3000,
    ownerOnly: false,
    run: async (client, message, args) => {
        const before = Date.now();
        const msg = await message.reply("🏓 Pinging...");
        const after = Date.now();

        const embed = new EmbedBuilder()
            .setColor("#9b59ff")
            .setTitle("🏓 Pong!")
            .addFields(
                { name: "📡 Message Latency", value: `\`${after - before}ms\``, inline: true },
                { name: "💓 API Latency",     value: `\`${Math.round(client.ws.ping)}ms\``, inline: true },
            )
            .setFooter({ text: message.author.username, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
            .setTimestamp();

        await msg.edit({ content: "", embeds: [embed] });
    },
};