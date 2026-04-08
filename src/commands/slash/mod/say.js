const { SlashCommandBuilder, PermissionsBitField } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("say")
    .setDescription("Send Message as bot")
    .addStringOption(option =>
      option.setName("words")
        .setDescription("the message")
        .setRequired(true))
    .addStringOption(option =>
      option.setName("reply_to")
        .setDescription("Message Id to reply (optional)"))
    .addBooleanOption(option =>
      option.setName("with_attachment")
        .setDescription("Just skip this"))
    .addAttachmentOption(option =>
      option.setName("upload")
        .setDescription("Upload file (sent a file as bot)")),

  run: async (client, interaction) => {
    const member = interaction.member;

    if (!member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({
        content: "Kamu bukan admin.",
        flags: 64 // ephemeral: true
      });
    }

    const words = interaction.options.getString("words");
    const replyTo = interaction.options.getString("reply_to");
    const withAttachment = interaction.options.getBoolean("with_attachment");
    const uploadedFile = interaction.options.getAttachment("upload");

    const messageOptions = { content: words, files: [] };

    if (replyTo) {
      try {
        const targetMessage = await interaction.channel.messages.fetch(replyTo);
        
        if (withAttachment && targetMessage.attachments.size > 0) {
          for (const [, attachment] of targetMessage.attachments) {
            messageOptions.files.push(attachment.url);
          }
        }

        messageOptions.reply = { messageReference: targetMessage.id };
      } catch (err) {
        return interaction.reply({
          content: "Failed to fetch the message ID for reply.",
          flags: 64
        });
      }
    }

    if (uploadedFile) {
      messageOptions.files.push(uploadedFile.url);
    }

    if (messageOptions.files.length === 0) {
      delete messageOptions.files;
    }

    await interaction.channel.send(messageOptions);
    await interaction.reply({
      content: "Message has been send.",
      flags: 64
    });
  }
};