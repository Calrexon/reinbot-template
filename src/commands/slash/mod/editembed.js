const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ComponentType,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('editembed')
    .setDescription('Edit an existing embed message')
    .addStringOption(option =>
      option
        .setName('message_id')
        .setDescription('The message ID containing the embed to edit')
        .setRequired(true)
    ),

  run: async (client, interaction) => {
    await interaction.deferReply({ flags: 64 });
    const messageId = interaction.options.getString('message_id');

    try {
      // Fetch the target message
      const message = await interaction.channel.messages.fetch(messageId);
      
      if (!message.embeds.length) {
        return interaction.editReply({
          content: 'The specified message does not contain any embeds.',
          flags: 64
        });
      }

      // Get the first embed and any existing buttons
      const originalEmbed = message.embeds[0];
      const embed = EmbedBuilder.from(originalEmbed);
      const buttons = message.components.flatMap(row => 
        row.components
          .filter(btn => btn.style === ButtonStyle.Link)
          .map(btn => ({
            label: btn.label,
            emoji: btn.emoji?.name || '',
            url: btn.url
          }))
      );

      let isSending = false;
      let modalHandler;

      // Button builder function
      const buildButtons = () => {
        const navRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('edit_main')
            .setLabel('Edit Main Content')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('edit_extra')
            .setLabel('Edit Extra Fields')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('edit_buttons')
            .setLabel('Edit Buttons')
            .setStyle(ButtonStyle.Primary)
        );

        const actionRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('save')
            .setLabel('💾 Save Changes')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId('cancel')
            .setLabel('❌ Cancel')
            .setStyle(ButtonStyle.Danger)
        );

        return [navRow, actionRow];
      };

      // Build button links for display
      const buildButtonLinks = () => {
        const rows = [];
        let currentRow = new ActionRowBuilder();
        
        buttons.forEach((btn, i) => {
          if (i > 0 && i % 5 === 0) {
            rows.push(currentRow);
            currentRow = new ActionRowBuilder();
          }
          
          const button = new ButtonBuilder()
            .setStyle(ButtonStyle.Link)
            .setURL(btn.url);
          
          if (btn.label) button.setLabel(btn.label);
          if (btn.emoji) button.setEmoji(btn.emoji);
          
          currentRow.addComponents(button);
        });
        
        if (currentRow.components.length > 0) {
          rows.push(currentRow);
        }
        
        return rows;
      };

      // Parse button input format
      const parseButtonFormat = (input) => {
        if (!input) return null;
        const parts = input.split('|').map(part => part.trim());
        
        if (parts.length >= 2 && parts[parts.length-1].match(/^https?:\/\/.+/)) {
          const url = parts.pop();
          const emoji = parts.length > 1 ? parts.pop() : null;
          const label = parts.join('|') || null;
          
          return {
            label,
            emoji,
            url
          };
        }
        return null;
      };

      // Send initial editor interface
      const msg = await interaction.editReply({
        content: `✏️ Editing embed from [this message](${message.url})`,
        embeds: [embed],
        components: [...buildButtons(), ...buildButtonLinks()],
        flags: 64
      });

      const collector = msg.createMessageComponentCollector({ 
        componentType: ComponentType.Button, 
        time: 15 * 60 * 1000,
        filter: i => i.user.id === interaction.user.id
      });

      collector.on('collect', async (btnInt) => {
        try {
          if (btnInt.customId === 'edit_main') {
            const modal = new ModalBuilder()
              .setCustomId(`edit_main_${Date.now()}`)
              .setTitle('Edit Main Content');

            const currentEmbed = embed.data;

            const titleInput = new TextInputBuilder()
              .setCustomId('embed_title')
              .setLabel('Title (use "Title | URL" for link)')
              .setStyle(TextInputStyle.Short)
              .setValue(
                currentEmbed.title 
                  ? (currentEmbed.url 
                      ? `${currentEmbed.title} | ${currentEmbed.url}`
                      : currentEmbed.title)
                  : '')
              .setRequired(false);

            const descInput = new TextInputBuilder()
              .setCustomId('embed_desc')
              .setLabel('Description')
              .setStyle(TextInputStyle.Paragraph)
              .setValue(currentEmbed.description || '')
              .setRequired(false);

            const colorInput = new TextInputBuilder()
              .setCustomId('embed_color')
              .setLabel('Color (#hex or "random")')
              .setStyle(TextInputStyle.Short)
              .setValue(currentEmbed.color ? `#${currentEmbed.color.toString(16).padStart(6, '0')}` : '')
              .setRequired(false);

            const imageInput = new TextInputBuilder()
              .setCustomId('embed_image')
              .setLabel('Image URL (large bottom image)')
              .setStyle(TextInputStyle.Short)
              .setValue(currentEmbed.image?.url || '')
              .setRequired(false);

            modal.addComponents(
              new ActionRowBuilder().addComponents(titleInput),
              new ActionRowBuilder().addComponents(descInput),
              new ActionRowBuilder().addComponents(colorInput),
              new ActionRowBuilder().addComponents(imageInput)
            );

            await btnInt.showModal(modal).catch(console.error);
          }
          else if (btnInt.customId === 'edit_extra') {
            const modal = new ModalBuilder()
              .setCustomId(`edit_extra_${Date.now()}`)
              .setTitle('Edit Extra Fields');

            const currentEmbed = embed.data;

            const thumbInput = new TextInputBuilder()
              .setCustomId('embed_thumb')
              .setLabel('Thumbnail URL (small top-right)')
              .setStyle(TextInputStyle.Short)
              .setValue(currentEmbed.thumbnail?.url || '')
              .setRequired(false);

            const timestampInput = new TextInputBuilder()
              .setCustomId('embed_timestamp')
              .setLabel('Show timestamp? (true/false)')
              .setStyle(TextInputStyle.Short)
              .setValue(currentEmbed.timestamp ? 'true' : 'false')
              .setRequired(false);

            const footerInput = new TextInputBuilder()
              .setCustomId('embed_footer')
              .setLabel('Footer (use "Text | IconURL")')
              .setStyle(TextInputStyle.Short)
              .setValue(
                currentEmbed.footer 
                  ? (currentEmbed.footer.icon_url
                      ? `${currentEmbed.footer.text} | ${currentEmbed.footer.icon_url}`
                      : currentEmbed.footer.text)
                  : '')
              .setRequired(false);

            const authorInput = new TextInputBuilder()
              .setCustomId('embed_author')
              .setLabel('Author (use "Name | IconURL")')
              .setStyle(TextInputStyle.Short)
              .setValue(
                currentEmbed.author
                  ? `${currentEmbed.author.name} | ${currentEmbed.author.icon_url || ''}`
                  : '')
              .setRequired(false);

            modal.addComponents(
              new ActionRowBuilder().addComponents(thumbInput),
              new ActionRowBuilder().addComponents(timestampInput),
              new ActionRowBuilder().addComponents(footerInput),
              new ActionRowBuilder().addComponents(authorInput)
            );

            await btnInt.showModal(modal).catch(console.error);
          }
          else if (btnInt.customId === 'edit_buttons') {
            const modal = new ModalBuilder()
              .setCustomId(`edit_buttons_${Date.now()}`)
              .setTitle('Edit Buttons (Max 5)');

            // Create 5 text inputs for buttons
            for (let i = 1; i <= 5; i++) {
              const buttonInput = new TextInputBuilder()
                .setCustomId(`button_${i}`)
                .setLabel(`Button ${i} (Text | Emoji | URL)`)
                .setPlaceholder('Example: Click Me | 🚀 | https://example.com')
                .setStyle(TextInputStyle.Short)
                .setValue(buttons[i-1] ? 
                  `${buttons[i-1].label || ''} | ${buttons[i-1].emoji || ''} | ${buttons[i-1].url}` 
                  : '')
                .setRequired(false);
              
              modal.addComponents(new ActionRowBuilder().addComponents(buttonInput));
            }

            await btnInt.showModal(modal).catch(console.error);
          }
          else if (btnInt.customId === 'save') {
            if (isSending) return;
            isSending = true;
            
            try {
              const buttonRows = buildButtonLinks();
              await message.edit({ 
                embeds: [embed], 
                components: buttonRows 
              });
              
              await btnInt.update({
                content: '✅ Successfully updated the embed!',
                embeds: [],
                components: [],
              });
              collector.stop();
            } catch (error) {
              console.error('Error updating embed:', error);
              isSending = false;
              await btnInt.update({
                content: '❌ Failed to update the embed. Make sure I have permission to edit messages.',
                embeds: [],
                components: [],
              });
            }
          }
          else if (btnInt.customId === 'cancel') {
            await btnInt.update({
              content: '❌ Edit cancelled',
              embeds: [],
              components: [],
            });
            collector.stop();
          }
        } catch (error) {
          console.error('Error in button interaction:', error);
          if (!btnInt.replied) {
            await btnInt.reply({ 
              content: 'An error occurred while processing your request.', 
              flags: 64 
            }).catch(console.error);
          }
        }
      });

      // Handle modal submissions
      modalHandler = async (modalInt) => {
        if (!modalInt.isModalSubmit()) return;

        try {
          if (modalInt.customId.startsWith('edit_main_')) {
            const titleValue = modalInt.fields.getTextInputValue('embed_title');
            const newDesc = modalInt.fields.getTextInputValue('embed_desc');
            const color = modalInt.fields.getTextInputValue('embed_color');
            const imageUrl = modalInt.fields.getTextInputValue('embed_image');

            // Parse title and URL
            if (titleValue) {
              const parts = titleValue.split('|').map(part => part.trim());
              if (parts.length === 2 && parts[1].match(/^https?:\/\/.+/)) {
                embed.setTitle(parts[0]);
                embed.setURL(parts[1]);
              } else {
                embed.setTitle(titleValue);
                embed.data.url = undefined;
              }
            } else {
              embed.setTitle(null);
              embed.data.url = undefined;
            }

            embed.setDescription(newDesc || null);
            
            // Handle color
            if (color) {
              const cleanColor = color.replace('#', '').trim();
              if (/^[0-9a-fA-F]{6}$/.test(cleanColor)) {
                embed.setColor(cleanColor);
              } else if (color.toLowerCase() === 'random') {
                embed.setColor('Random');
              }
            }

            // Handle image
            if (imageUrl && imageUrl.match(/^https?:\/\/.+/)) {
              embed.setImage(imageUrl);
            } else {
              embed.data.image = undefined;
            }
          } 
          else if (modalInt.customId.startsWith('edit_extra_')) {
            const thumbUrl = modalInt.fields.getTextInputValue('embed_thumb');
            const timestamp = modalInt.fields.getTextInputValue('embed_timestamp');
            const footerValue = modalInt.fields.getTextInputValue('embed_footer');
            const authorValue = modalInt.fields.getTextInputValue('embed_author');

            // Handle thumbnail
            if (thumbUrl && thumbUrl.match(/^https?:\/\/.+/)) {
              embed.setThumbnail(thumbUrl);
            } else {
              embed.data.thumbnail = undefined;
            }

            // Handle timestamp
            embed.setTimestamp(timestamp?.toLowerCase() === 'true' ? Date.now() : null);

            // Handle footer
            if (footerValue) {
              const footerParts = footerValue.split('|').map(part => part.trim());
              if (footerParts.length === 2 && footerParts[1].match(/^https?:\/\/.+/)) {
                embed.setFooter({ 
                  text: footerParts[0], 
                  iconURL: footerParts[1] 
                });
              } else {
                embed.setFooter({ text: footerValue });
              }
            } else {
              embed.data.footer = undefined;
            }

            // Handle author
            if (authorValue) {
              const authorParts = authorValue.split('|').map(part => part.trim());
              if (authorParts.length >= 1) {
                const authorData = {
                  name: authorParts[0],
                  iconURL: authorParts[1]?.match(/^https?:\/\/.+/) ? authorParts[1] : undefined
                };
                embed.setAuthor(authorData);
              }
            } else {
              embed.data.author = undefined;
            }
          }
          else if (modalInt.customId.startsWith('edit_buttons_')) {
            // Clear existing buttons
            buttons.length = 0;
            
            // Process up to 5 buttons
            for (let i = 1; i <= 5; i++) {
              const buttonValue = modalInt.fields.getTextInputValue(`button_${i}`);
              if (buttonValue) {
                const buttonData = parseButtonFormat(buttonValue);
                if (buttonData && buttonData.url) {
                  buttons.push(buttonData);
                }
              }
            }
          }

          try {
            await modalInt.deferUpdate();
            await msg.edit({
              content: `✏️ Editing embed from [this message](${message.url})`,
              embeds: [embed],
              components: [...buildButtons(), ...buildButtonLinks()]
            });
          } catch (error) {
            console.error('Error updating editor message:', error);
            if (!modalInt.replied) {
              await modalInt.reply({ 
                content: 'Changes saved, but could not update the editor.', 
                flags: 64 
              }).catch(console.error);
            }
          }
        } catch (error) {
          console.error('Error handling modal submission:', error);
          if (!modalInt.replied) {
            await modalInt.reply({ 
              content: 'An error occurred while saving your changes.', 
              flags: 64 
            }).catch(console.error);
          }
        }
      };

      // Register modal handler
      interaction.client.on('interactionCreate', modalHandler);

      collector.on('end', async (_, reason) => {
        try {
          // Remove modal handler when collector ends
          interaction.client.off('interactionCreate', modalHandler);
          
          if (reason !== 'messageDelete') {
            await interaction.editReply({ 
              components: [] 
            }).catch(console.error);
          }
        } catch (error) {
          console.error('Error ending collector:', error);
        }
      });

    } catch (error) {
      console.error('Error fetching message:', error);
      await interaction.editReply({
        content: 'Could not find a message with that ID in this channel. Make sure you copied the correct message ID.',
        flags: 64
      });
    }
  },
};