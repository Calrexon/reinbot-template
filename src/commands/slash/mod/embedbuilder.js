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
  ChannelType,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('embedbuilder')
    .setDescription('Build and send custom embeds to a channel')
    .addChannelOption(option =>
      option
        .setName('channel')
        .setDescription('Channel to send the embed to (default: current channel)')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    ),

  run: async (client, interaction) => {
    await interaction.deferReply({ flags: 64 });
    const targetChannel = interaction.options.getChannel('channel') || interaction.channel;

    const embeds = [
      new EmbedBuilder()
        .setTitle('Default Embed')
        .setDescription('This is a default embed.')
        .setColor('#5865F2'),
    ];
    let index = 0;
    let isSending = false;
    const buttons = [];

    // Track active modals
    const activeModals = new Map();

    const buildButtons = () => {
      const navRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('prev')
          .setLabel('◄ Previous')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(index === 0),
        new ButtonBuilder()
          .setCustomId('next')
          .setLabel('Next ►')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(index === embeds.length - 1),
        new ButtonBuilder()
          .setCustomId('add')
          .setLabel('➕ New Embed')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('delete')
          .setLabel('🗑️ Delete')
          .setStyle(ButtonStyle.Danger)
          .setDisabled(embeds.length <= 1)
      );

      const editRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('edit_main')
          .setLabel('Edit Content')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('edit_extra')
          .setLabel('Edit Extra')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('edit_buttons')
          .setLabel('Edit Buttons')
          .setStyle(ButtonStyle.Primary)
      );

      return [navRow, editRow];
    };

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

    const actionRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('save')
        .setLabel(`📤 Send to #${targetChannel.name}`)
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('cancel')
        .setLabel('❌ Cancel')
        .setStyle(ButtonStyle.Danger)
    );

    const msg = await interaction.editReply({
      content: `📝 Embed Builder (${index + 1}/${embeds.length}) - Will be sent to ${targetChannel}`,
      embeds: [embeds[index]],
      components: [...buildButtons(), actionRow],
      flags: 64
    });

    const collector = msg.createMessageComponentCollector({ 
      componentType: ComponentType.Button, 
      time: 15 * 60 * 1000,
      filter: i => i.user.id === interaction.user.id
    });

    const parseLinkFormat = (input) => {
      if (!input) return null;
      const parts = input.split('|').map(part => part.trim());
      if (parts.length === 2 && parts[1].match(/^https?:\/\/.+/)) {
        return { name: parts[0], url: parts[1] };
      }
      return { name: input, url: null };
    };

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

    collector.on('collect', async (btnInt) => {
      try {
        if (btnInt.customId === 'next') {
          index = Math.min(index + 1, embeds.length - 1);
          await btnInt.update({ 
            content: `📝 Embed Builder (${index + 1}/${embeds.length}) - Will be sent to ${targetChannel}`,
            embeds: [embeds[index]],
            components: [...buildButtons(), actionRow]
          });
        } 
        else if (btnInt.customId === 'prev') {
          index = Math.max(index - 1, 0);
          await btnInt.update({ 
            content: `📝 Embed Builder (${index + 1}/${embeds.length}) - Will be sent to ${targetChannel}`,
            embeds: [embeds[index]],
            components: [...buildButtons(), actionRow]
          });
        }
        else if (btnInt.customId === 'add') {
          const newEmbed = new EmbedBuilder()
            .setTitle('New Embed')
            .setDescription('Click "Edit Content" to customize')
            .setColor('#5865F2');
          embeds.push(newEmbed);
          index = embeds.length - 1;
          await btnInt.update({ 
            content: `📝 Embed Builder (${index + 1}/${embeds.length}) - Will be sent to ${targetChannel}`,
            embeds: [newEmbed],
            components: [...buildButtons(), actionRow]
          });
        }
        else if (btnInt.customId === 'delete') {
          if (embeds.length > 1) {
            embeds.splice(index, 1);
            index = Math.min(index, embeds.length - 1);
            await btnInt.update({ 
              content: `📝 Embed Builder (${index + 1}/${embeds.length}) - Will be sent to ${targetChannel}`,
              embeds: [embeds[index]],
              components: [...buildButtons(), actionRow]
            });
          }
        }
        else if (btnInt.customId === 'edit_main') {
          const modalId = `edit_main_${Date.now()}`;
          const modal = new ModalBuilder()
            .setCustomId(modalId)
            .setTitle(`Edit Main Content - Embed ${index + 1}/${embeds.length}`);

          const currentEmbed = embeds[index].data;

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

          activeModals.set(modalId, {
            type: 'main',
            index,
            interaction: btnInt
          });

          await btnInt.showModal(modal).catch(console.error);
        }
        else if (btnInt.customId === 'edit_extra') {
          const modalId = `edit_extra_${Date.now()}`;
          const modal = new ModalBuilder()
            .setCustomId(modalId)
            .setTitle(`Edit Extra Fields - Embed ${index + 1}/${embeds.length}`);

          const currentEmbed = embeds[index].data;

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

          activeModals.set(modalId, {
            type: 'extra',
            index,
            interaction: btnInt
          });

          await btnInt.showModal(modal).catch(console.error);
        }
        else if (btnInt.customId === 'edit_buttons') {
          const modalId = `edit_buttons_${Date.now()}`;
          const modal = new ModalBuilder()
            .setCustomId(modalId)
            .setTitle(`Edit Buttons (Max 5)`);

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

          activeModals.set(modalId, {
            type: 'buttons',
            index,
            interaction: btnInt
          });

          await btnInt.showModal(modal).catch(console.error);
        }
        else if (btnInt.customId === 'save') {
          if (isSending) return;
          isSending = true;
          
          try {
            const buttonRows = buildButtonLinks();
            await targetChannel.send({ 
              embeds: [embeds[index]], 
              components: buttonRows 
            });
            await btnInt.update({
              content: `✅ Successfully sent embed to ${targetChannel}`,
              embeds: [],
              components: [],
            });
            collector.stop();
          } catch (error) {
            console.error('Error sending embed:', error);
            isSending = false;
            await btnInt.update({
              content: `❌ Failed to send embed to ${targetChannel}. Make sure I have permissions to send messages there.`,
              embeds: [],
              components: [],
            });
          }
        }
        else if (btnInt.customId === 'cancel') {
          await btnInt.update({
            content: '❌ Embed creation cancelled',
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
    interaction.client.on('interactionCreate', async (modalInt) => {
      if (!modalInt.isModalSubmit()) return;
      
      const modalData = activeModals.get(modalInt.customId);
      if (!modalData) return;

      try {
        const { type, index, interaction: btnInt } = modalData;
        activeModals.delete(modalInt.customId);

        if (index >= embeds.length) {
          return modalInt.reply({ 
            content: 'The embed being edited no longer exists.', 
            flags: 64 
          }).catch(console.error);
        }

        if (type === 'main') {
          const titleValue = modalInt.fields.getTextInputValue('embed_title');
          const newDesc = modalInt.fields.getTextInputValue('embed_desc');
          const color = modalInt.fields.getTextInputValue('embed_color');
          const imageUrl = modalInt.fields.getTextInputValue('embed_image');

          const titleData = parseLinkFormat(titleValue);
          if (titleData) {
            embeds[index].setTitle(titleData.name);
            titleData.url ? embeds[index].setURL(titleData.url) : embeds[index].data.url = undefined;
          } else {
            embeds[index].setTitle(null);
            embeds[index].data.url = undefined;
          }

          embeds[index].setDescription(newDesc || null);
          
          if (color) {
            const cleanColor = color.replace('#', '').trim();
            if (/^[0-9a-fA-F]{6}$/.test(cleanColor)) {
              embeds[index].setColor(cleanColor);
            } else if (color.toLowerCase() === 'random') {
              embeds[index].setColor('Random');
            }
          }

          if (imageUrl && imageUrl.match(/^https?:\/\/.+/)) {
            embeds[index].setImage(imageUrl);
          } else {
            embeds[index].data.image = undefined;
          }
        } 
        else if (type === 'extra') {
          const thumbUrl = modalInt.fields.getTextInputValue('embed_thumb');
          const timestamp = modalInt.fields.getTextInputValue('embed_timestamp');
          const footerValue = modalInt.fields.getTextInputValue('embed_footer');
          const authorValue = modalInt.fields.getTextInputValue('embed_author');

          if (thumbUrl && thumbUrl.match(/^https?:\/\/.+/)) {
            embeds[index].setThumbnail(thumbUrl);
          } else {
            embeds[index].data.thumbnail = undefined;
          }

          embeds[index].setTimestamp(timestamp?.toLowerCase() === 'true' ? Date.now() : null);

          if (footerValue) {
            const footerParts = footerValue.split('|').map(part => part.trim());
            if (footerParts.length === 2 && footerParts[1].match(/^https?:\/\/.+/)) {
              embeds[index].setFooter({ 
                text: footerParts[0], 
                iconURL: footerParts[1] 
              });
            } else {
              embeds[index].setFooter({ text: footerValue });
            }
          } else {
            embeds[index].data.footer = undefined;
          }

          if (authorValue) {
            const authorParts = authorValue.split('|').map(part => part.trim());
            if (authorParts.length >= 1) {
              const authorData = {
                name: authorParts[0],
                iconURL: authorParts[1]?.match(/^https?:\/\/.+/) ? authorParts[1] : undefined
              };
              embeds[index].setAuthor(authorData);
            }
          } else {
            embeds[index].data.author = undefined;
          }
        }
        else if (type === 'buttons') {
          buttons.length = 0;
          
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

        await modalInt.deferUpdate();
        await btnInt.editReply({
          content: `📝 Embed Builder (${index + 1}/${embeds.length}) - Will be sent to ${targetChannel}`,
          embeds: [embeds[index]],
          components: [...buildButtons(), actionRow]
        });
      } catch (error) {
        console.error('Error handling modal submission:', error);
        await modalInt.reply({ 
          content: 'An error occurred while saving your changes.', 
          flags: 64 
        }).catch(console.error);
      }
    });

    collector.on('end', async (_, reason) => {
      try {
        activeModals.clear();
        if (reason !== 'messageDelete') {
          await interaction.editReply({ 
            components: [] 
          }).catch(console.error);
        }
      } catch (error) {
        console.error('Error ending collector:', error);
      }
    });
  },
};