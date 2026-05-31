/**
 * @file addons/utility/tickets.js
 * @description Advanced ticket management system.
 * Handles ticket creation, claiming, closing, and transcript generation.
 * Uses Discord Components V2 for rich interaction.
 *
 * © 2026 Cortex HQ & bot-hosting.net
 */

const { ChannelType, PermissionFlagsBits, MessageFlags, EmbedBuilder } = require("discord.js");
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

    const botConfig = storage.get("bot_identity", guildId) || {};
    const accentColor = botConfig.embedColor ? parseInt(botConfig.embedColor, 16) : 0x3b82f6;

    /**
     * Helper to log ticket events.
     */
    const logTicket = async (action, ticketId, userId, extra = {}) => {
      const logsConfig = storage.get("logs", guildId) || {};
      if (logsConfig.tickets_enabled === false || botConfig.loggingEnabled === false) return;

      const embed = new EmbedBuilder()
        .setColor(action === "open" ? 0x10b981 : 0xef4444)
        .setTitle(`${Emojis.resolve(client, "info", guildId)} Ticket Event: ${action.toUpperCase()}`)
        .addFields(
          { name: "Ticket ID", value: `\`${ticketId}\``, inline: true },
          { name: "User", value: `<@${userId}>`, inline: true }
        )
        .setTimestamp();

      if (Object.keys(extra).length) {
        for (const [key, value] of Object.entries(extra)) {
          embed.addFields({ name: key, value: String(value), inline: true });
        }
      }

      await client.logger.broadcastEmbed(guildId, "tickets", embed);
    };

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

        const payload = {
          flags: 1 << 15,
          components: [
            {
              type: 17,
              accent_color: accentColor,
              components: [
                { type: 10, content: `# ${Emojis.resolve(client, "support", guildId)} Ticket Initialized` },
                { type: 14 },
                { type: 10, content: `Welcome <@${interaction.user.id}>! Please describe your issue. Support staff (<@&${config.staffRoleId}>) will be with you shortly.` },
                { type: 14 },
                {
                  type: 1,
                  components: [
                    { type: 2, style: 1, custom_id: "ticket_claim", label: "Claim Ticket", emoji: { name: "🙋‍♂️" } },
                    { type: 2, style: 4, custom_id: "ticket_close", label: "Close Ticket", emoji: { name: "🔒" } }
                  ]
                }
              ]
            }
          ]
        };

        await channel.send(payload);
        await logTicket("open", channel.id, interaction.user.id);

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

      const payload = {
        flags: 1 << 15,
        components: [
          {
            type: 17,
            accent_color: accentColor,
            components: [
              { type: 10, content: `# ${Emojis.resolve(client, "support", guildId)} Ticket Initialized` },
              { type: 14 },
              { type: 10, content: `Welcome <@${ticket.userId}>! Please describe your issue. Support staff will be with you shortly.\n\n**Claimed By:** <@${interaction.user.id}>` },
              { type: 14 },
              {
                type: 1,
                components: [
                  { type: 2, style: 1, custom_id: "ticket_claim", label: "Claim Ticket", emoji: { name: "🙋‍♂️" }, disabled: true },
                  { type: 2, style: 4, custom_id: "ticket_close", label: "Close Ticket", emoji: { name: "🔒" } }
                ]
              }
            ]
          }
        ]
      };

      await interaction.message.edit(payload);
      await logTicket("claim", interaction.channelId, ticket.userId, { "Claimed By": interaction.user.tag });

      return interaction.reply({ content: `${Emojis.resolve(client, "success", guildId)} You have claimed this ticket.`, flags: MessageFlags.Ephemeral });
    }

    // 3. Ticket Closing
    if (interaction.isButton() && interaction.customId === "ticket_close") {
      const activeTickets = storage.get("tickets_active", guildId) || {};
      const ticket = activeTickets[interaction.channelId];
      if (!ticket) return;

      const isOwner = interaction.user.id === ticket.userId;
      const isStaff = interaction.member.roles.cache.has(config.staffRoleId) || interaction.member.permissions.has(PermissionFlagsBits.Administrator);

      if (!isOwner && !isStaff) {
        return interaction.reply({ content: `${Emojis.resolve(client, "error", guildId)} You do not have permission to close this ticket.`, flags: MessageFlags.Ephemeral });
      }

      await interaction.deferReply();

      try {
        const transcript = await createTranscript(interaction.channel, {
          limit: -1,
          returnType: "attachment",
          fileName: `transcript-${interaction.channel.name}.html`,
          inlineAvatars: true,
          inlineImages: true
        });

        await logTicket("close", ticket.id, ticket.userId, { "Closed By": interaction.user.tag });

        // Specialized log with transcript
        const logsConfig = storage.get("logs", guildId) || {};
        const logChannelId = config.logsChannelId || logsConfig.tickets || process.env.AUDIT_LOG_CHANNEL_ID;
        if (logChannelId) {
          const logChannel = await interaction.guild.channels.fetch(logChannelId).catch(() => null);
          if (logChannel) {
            await logChannel.send({
              flags: 1 << 15,
              components: [{
                type: 17,
                accent_color: 0xef4444,
                components: [
                  { type: 10, content: `# ${Emojis.resolve(client, "error", guildId)} Ticket Closed` },
                  { type: 14 },
                  { type: 10, content: `**Ticket ID:** \`${ticket.id}\`\n**Opened By:** <@${ticket.userId}>\n**Closed By:** <@${interaction.user.id}>` }
                ]
              }],
              files: [transcript]
            });
          }
        }

        const user = await client.users.fetch(ticket.userId).catch(() => null);
        if (user) {
          await user.send({
            content: `${Emojis.resolve(client, "info", guildId)} Your ticket **${interaction.channel.name}** has been closed. Attached is your transcript.`,
            files: [transcript]
          }).catch(() => null);
        }

        delete activeTickets[interaction.channelId];
        storage.set("tickets_active", guildId, activeTickets);

        await interaction.editReply({
          flags: 1 << 15,
          components: [{
            type: 17,
            accent_color: 0x10b981,
            components: [
              { type: 10, content: `# ${Emojis.resolve(client, "success", guildId)} Closing Ticket...` },
              { type: 14 },
              { type: 10, content: "This channel will be removed in 5 seconds." }
            ]
          }]
        });

        setTimeout(() => interaction.channel.delete().catch(() => null), 5000);
      } catch (err) {
        client.logger.error("Failed to close ticket and generate transcript:", { error: err.message });
        return interaction.editReply({ content: `${Emojis.resolve(client, "error", guildId)} Failed to generate transcript. Closing channel anyway...` });
      }
    }
  }
};
