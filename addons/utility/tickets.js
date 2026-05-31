/**
 * @file addons/utility/tickets.js
 * @description Advanced ticket management system.
 * Handles ticket creation, claiming, closing, and transcript generation.
 *
 * © 2026 Cortex HQ & bot-hosting.net
 */

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits, MessageFlags } = require("discord.js");
const { createTranscript } = require("nexus-transcripts");
const Emojis = require("../../config/emojis");
const storage = require("../../utils/storage");

module.exports = {
  name: "TicketSystem",

  /**
   * Handle ticket-related interactions.
   * @param {import('discord.js').Interaction} interaction
   * @param {import('discord.js').Client} client
   */
  async handleInteraction(interaction, client) {
    const guildId = interaction.guildId;
    const config = storage.get("tickets", guildId);
    if (!config) return;

    // 1. Ticket Creation (Button on Panel)
    if (interaction.isButton() && interaction.customId === "ticket_open") {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      const activeTickets = storage.get("tickets_active", guildId) || {};
      const userTicket = Object.values(activeTickets).find(t => t.userId === interaction.user.id && t.status === "open");

      if (userTicket) {
        return interaction.editReply({
          content: `${Emojis.resolve(client, "error", guildId)} You already have an active ticket: <#${userTicket.channelId}>.`
        });
      }

      try {
        const channel = await interaction.guild.channels.create({
          name: `ticket-${interaction.user.username}`,
          type: ChannelType.GuildText,
          parent: config.categoryId || null,
          permissionOverwrites: [
            { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
            { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles] },
            { id: config.staffRoleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles] }
          ]
        });

        const ticketData = {
          id: channel.id,
          channelId: channel.id,
          userId: interaction.user.id,
          status: "open",
          createdAt: Date.now()
        };

        activeTickets[channel.id] = ticketData;
        storage.set("tickets_active", guildId, activeTickets);

        const embed = new EmbedBuilder()
          .setColor(0x3b82f6)
          .setTitle(`${Emojis.resolve(client, "support", guildId)} Ticket Initialized`)
          .setDescription(`Welcome <@${interaction.user.id}>! Please describe your issue. Support staff will be with you shortly.`)
          .setFooter({ text: "Ticket System • Advanced Management" })
          .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("ticket_close").setLabel("Close Ticket").setStyle(ButtonStyle.Danger).setEmoji("🔒"),
          new ButtonBuilder().setCustomId("ticket_claim").setLabel("Claim Ticket").setStyle(ButtonStyle.Primary).setEmoji("🙋‍♂️")
        );

        await channel.send({ content: `<@${interaction.user.id}> | <@&${config.staffRoleId}>`, embeds: [embed], components: [row] });

        return interaction.editReply({ content: `${Emojis.resolve(client, "success", guildId)} Ticket created successfully: <#${channel.id}>` });
      } catch (err) {
        client.logger.error("Failed to create ticket channel:", { error: err.message });
        return interaction.editReply({ content: `${Emojis.resolve(client, "error", guildId)} Failed to create ticket. Please contact an admin.` });
      }
    }

    // 2. Ticket Claiming
    if (interaction.isButton() && interaction.customId === "ticket_claim") {
      if (!interaction.member.roles.cache.has(config.staffRoleId) && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({ content: `${Emojis.resolve(client, "error", guildId)} Only staff can claim tickets.`, flags: MessageFlags.Ephemeral });
      }

      const activeTickets = storage.get("tickets_active", guildId) || {};
      const ticket = activeTickets[interaction.channelId];
      if (!ticket) return;

      if (ticket.claimedBy) {
        return interaction.reply({ content: `${Emojis.resolve(client, "error", guildId)} This ticket is already claimed by <@${ticket.claimedBy}>.`, flags: MessageFlags.Ephemeral });
      }

      ticket.claimedBy = interaction.user.id;
      storage.set("tickets_active", guildId, activeTickets);

      const embed = EmbedBuilder.from(interaction.message.embeds[0])
        .addFields({ name: "Claimed By", value: `<@${interaction.user.id}>`, inline: true });

      await interaction.message.edit({ embeds: [embed] });
      return interaction.reply({ content: `${Emojis.resolve(client, "success", guildId)} You have claimed this ticket.` });
    }

    // 3. Ticket Closing
    if (interaction.isButton() && interaction.customId === "ticket_close") {
      await interaction.deferReply();

      const activeTickets = storage.get("tickets_active", guildId) || {};
      const ticket = activeTickets[interaction.channelId];
      if (!ticket) return;

      try {
        // Generate Transcript using Nexus Transcripts
        const transcript = await createTranscript(interaction.channel, {
          limit: -1,
          returnType: "attachment",
          fileName: `transcript-${interaction.channel.name}.html`,
          inlineAvatars: true,
          inlineImages: true
        });

        // Log to Audit Channel
        const logChannelId = config.logsChannelId || process.env.AUDIT_LOG_CHANNEL_ID;
        if (logChannelId) {
          const logChannel = await interaction.guild.channels.fetch(logChannelId).catch(() => null);
          if (logChannel) {
            const logEmbed = new EmbedBuilder()
              .setColor(0xef4444)
              .setTitle(`${Emojis.resolve(client, "error", guildId)} Ticket Closed`)
              .addFields(
                { name: "Ticket ID", value: `\`${ticket.id}\``, inline: true },
                { name: "Opened By", value: `<@${ticket.userId}>`, inline: true },
                { name: "Closed By", value: `<@${interaction.user.id}>`, inline: true }
              )
              .setTimestamp();

            await logChannel.send({ embeds: [logEmbed], files: [transcript] });
          }
        }

        // Send transcript to user (optional but advanced)
        const user = await client.users.fetch(ticket.userId).catch(() => null);
        if (user) {
          await user.send({
            content: `${Emojis.resolve(client, "info", guildId)} Your ticket **${interaction.channel.name}** has been closed. Attached is your transcript.`,
            files: [transcript]
          }).catch(() => null);
        }

        // Clean up
        delete activeTickets[interaction.channelId];
        storage.set("tickets_active", guildId, activeTickets);

        await interaction.editReply({ content: `${Emojis.resolve(client, "success", guildId)} Ticket closing... channel will be removed in 5 seconds.` });

        setTimeout(() => interaction.channel.delete().catch(() => null), 5000);
      } catch (err) {
        client.logger.error("Failed to close ticket and generate transcript:", { error: err.message });
        return interaction.editReply({ content: `${Emojis.resolve(client, "error", guildId)} Failed to generate transcript. Closing channel anyway...` });
      }
    }
  }
};
