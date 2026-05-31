/**
 * @file addons/giveaways/giveaway.js
 * @description Official /giveaway advanced command suite.
 * Orchestrates the creation and broadcasting of advanced server giveaways
 * utilizing Discord Components V2 Containers and TextDisplays.
 *
 * © 2026 Cortex HQ & bot-hosting.net
 */

const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, EmbedBuilder } = require("discord.js");
const Emojis = require("../../config/emojis");
const storage = require("../../utils/storage");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("giveaway")
    .setDescription("Base command for managing server giveaways.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageEvents)
    .addSubcommand(sub =>
      sub.setName("start")
        .setDescription("Launch a new interactive giveaway matrix.")
        .addStringOption(opt => opt.setName("prize").setDescription("The reward being offered.").setRequired(true))
        .addIntegerOption(opt => opt.setName("winners").setDescription("Number of potential victors.").setRequired(true))
        .addStringOption(opt => opt.setName("duration").setDescription("Giveaway lifespan (e.g., 1h, 1d).").setRequired(true))
        .addRoleOption(opt => opt.setName("role").setDescription("Role to ping for this giveaway.").setRequired(false))
    )
    .addSubcommand(sub =>
      sub.setName("end")
        .setDescription("Terminate an active giveaway matrix.")
        .addStringOption(opt => opt.setName("id").setDescription("The message ID of the giveaway.").setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName("reroll")
        .setDescription("Select a new victor for a concluded giveaway.")
        .addStringOption(opt => opt.setName("id").setDescription("The message ID of the giveaway.").setRequired(true))
    ),

  /**
   * Execute the giveaway start command.
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   * @param {import('discord.js').Client} client
   */
  async execute(interaction, client) {
    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guildId;

    /**
     * Helper to log giveaway events.
     */
    const logGiveaway = async (action, giveawayId, prize, extra = {}) => {
      const botConfig = storage.get("bot_identity", guildId) || {};
      const logsConfig = storage.get("logs", guildId) || {};
      if (logsConfig.giveaways_enabled === false || botConfig.loggingEnabled === false) return;

      const embed = new EmbedBuilder()
        .setColor(0x8b5cf6)
        .setTitle(`${Emojis.resolve(client, "info", guildId)} Giveaway Event: ${action.toUpperCase()}`)
        .addFields(
          { name: "Giveaway ID", value: `\`${giveawayId}\``, inline: true },
          { name: "Prize", value: prize, inline: true }
        )
        .setTimestamp();

      if (Object.keys(extra).length) {
        for (const [key, value] of Object.entries(extra)) {
          embed.addFields({ name: key, value: String(value), inline: true });
        }
      }

      await client.logger.broadcastEmbed(guildId, "giveaways", embed);
    };

    if (subcommand === "end") {
      const messageId = interaction.options.getString("id");
      const giveaway = client.giveaways.get(messageId);

      if (!giveaway) {
        return interaction.reply({
          content: `${Emojis.resolve(client, "error", interaction.guildId)} **System Error:** No active giveaway found with ID \`${messageId}\`.`,
          flags: MessageFlags.Ephemeral
        });
      }

      const participants = giveaway.participants;
      if (!participants || participants.size === 0) {
        client.giveaways.delete(messageId);
        storage.delete("giveaways", messageId);

        const channel = await client.channels.fetch(giveaway.channelId).catch(() => null);
        if (channel) {
          await channel.send({
            flags: 1 << 15,
            components: [{
              type: 17,
              accent_color: 0xef4444,
              components: [
                { type: 10, content: `# ${Emojis.resolve(client, "error", guildId)} Giveaway Concluded!` },
                { type: 14 },
                { type: 10, content: `**Reward:** ${giveaway.prize}\n**Result:** No winners could be determined as no users entered the giveaway matrix.\n**Giveaway ID:** \`${messageId}\`` }
              ]
            }]
          });
        }

        await logGiveaway("end", messageId, giveaway.prize, { "Result": "No participants" });

        return interaction.reply({
          content: `${Emojis.resolve(client, "success", interaction.guildId)} **Giveaway Terminated:** No participants synchronized with matrix \`${messageId}\`.`,
          flags: MessageFlags.Ephemeral
        });
      }

      const winners = [...participants]
        .sort(() => 0.5 - Math.random())
        .slice(0, giveaway.winnersCount);

      client.giveaways.delete(messageId);
      storage.delete("giveaways", messageId);

      // DM Winners
      for (const winnerId of winners) {
        const user = await client.users.fetch(winnerId).catch(() => null);
        if (user) {
          await user.send({
            content: `${Emojis.resolve(client, "success", interaction.guildId)} Congratulations! You won the giveaway for **${giveaway.prize}** in **${interaction.guild.name}**!`
          }).catch(() => null);
        }
      }

      await logGiveaway("end", messageId, giveaway.prize, { "Winners": winners.length });

      const botConfig = storage.get("bot_identity", guildId) || {};
      return interaction.reply({
        flags: 1 << 15,
        components: [{
          type: 17,
          accent_color: botConfig.embedColor ? parseInt(botConfig.embedColor, 16) : 0x10b981,
          components: [
            { type: 10, content: `# ${Emojis.resolve(client, "success", guildId)} Giveaway Concluded!` },
            { type: 14 },
            { type: 10, content: `**Reward:** ${giveaway.prize}\n**Winner(s):** ${winners.map(id => `<@${id}>`).join(", ")}\n**Giveaway ID:** \`${messageId}\`` }
          ]
        }]
      });
    }

    if (subcommand === "reroll") {
      const messageId = interaction.options.getString("id");
      const giveaway = client.giveaways.get(messageId) || storage.get("giveaways", messageId);

      if (!giveaway) {
        return interaction.reply({
          content: `${Emojis.resolve(client, "error", interaction.guildId)} **System Error:** No giveaway data found for ID \`${messageId}\`.`,
          flags: MessageFlags.Ephemeral
        });
      }

      const participants = giveaway.participants instanceof Set ? [...giveaway.participants] : (giveaway.participants || []);
      if (participants.length === 0) {
        return interaction.reply({
          content: `${Emojis.resolve(client, "error", interaction.guildId)} **Reroll Failed:** No participants found for matrix \`${messageId}\`.`,
          flags: MessageFlags.Ephemeral
        });
      }

      const winnerId = participants[Math.floor(Math.random() * participants.length)];
      const user = await client.users.fetch(winnerId).catch(() => null);
      if (user) {
        await user.send({
          content: `${Emojis.resolve(client, "success", interaction.guildId)} Congratulations! You won the reroll for **${giveaway.prize}** in **${interaction.guild?.name || "a server"}**!`
        }).catch(() => null);
      }

      await logGiveaway("reroll", messageId, giveaway.prize, { "New Winner": winnerId });

      const botConfig = storage.get("bot_identity", guildId) || {};
      return interaction.reply({
        flags: 1 << 15,
        components: [{
          type: 17,
          accent_color: botConfig.embedColor ? parseInt(botConfig.embedColor, 16) : 0x3b82f6,
          components: [
            { type: 10, content: `# ${Emojis.resolve(client, "refresh", guildId)} Giveaway Rerolled!` },
            { type: 14 },
            { type: 10, content: `**New Winner:** <@${winnerId}>\n**Giveaway ID:** \`${messageId}\`` }
          ]
        }]
      });
    }

    if (subcommand !== "start") return;

    const prize = interaction.options.getString("prize");
    const winnersCount = interaction.options.getInteger("winners");
    const durationInput = interaction.options.getString("duration");
    const pingRole = interaction.options.getRole("role");

    // Simple duration parser logic
    const msMap = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
    const match = durationInput.match(/^(\d+)([smhd])$/);

    if (!match) {
      return interaction.reply({
        content: `${Emojis.resolve(client, "error", interaction.guildId)} **Invalid Duration:** Please use a valid format (e.g., \`10m\`, \`1h\`, \`2d\`).`,
        flags: MessageFlags.Ephemeral
      });
    }

    const durationMs = parseInt(match[1]) * msMap[match[2]];
    const endTime = Math.floor((Date.now() + durationMs) / 1000);

    const botConfig = storage.get("bot_identity", interaction.guildId) || {};

    const payload = {
      flags: 1 << 15, // IS_COMPONENTS_V2 bitwise flag
      components: [
        {
          type: 17, // Container
          accent_color: botConfig.embedColor ? parseInt(botConfig.embedColor, 16) : 0x8b5cf6, // Premium Violet Accent
          components: [
            {
              type: 10, // TextDisplay
              content: `${pingRole ? `${pingRole.toString()}\n` : ""}# ${Emojis.resolve(client, "support", interaction.guildId)} New Giveaway Initialized!\nParticipate in the active matrix below for a chance to win.`
            },
            {
              type: 14 // Separator
            },
            {
              type: 10, // TextDisplay
              content: `• **Reward Pool:** ${prize}\n• **Victor Slots:** \`${winnersCount}\`\n• **Time Remaining:** <t:${endTime}:R> (<t:${endTime}:f>)`
            },
            {
              type: 14 // Separator
            },
            {
              type: 1, // ActionRow
              components: [
                {
                  type: 2,
                  style: 1, // Primary (Blue)
                  custom_id: "ga_enter",
                  label: "Enter Matrix",
                  emoji: { name: "🎉" }
                }
              ]
            }
          ]
        }
      ]
    };

    // Ephemeral response first
    await interaction.reply({
      content: `${Emojis.resolve(client, "success", interaction.guildId)} Giveaway matrix initialized! Sending broadcast to channel...`,
      flags: MessageFlags.Ephemeral
    });

    // Send broadcast
    const response = await interaction.channel.send(payload);

    const giveawayData = {
      id: response.id,
      channelId: interaction.channelId,
      guildId: interaction.guildId,
      prize,
      winnersCount,
      endTime,
      participants: [],
      hostId: interaction.user.id,
      status: "active"
    };

    // Initialize the giveaway matrix in memory
    client.giveaways.set(response.id, {
      ...giveawayData,
      participants: new Set()
    });

    // Persistent log
    storage.set("giveaways", response.id, giveawayData);

    await logGiveaway("start", response.id, prize, { "Winners": winnersCount, "Duration": durationInput });

    // Schedule end
    setTimeout(async () => {
      const activeGiveaway = client.giveaways.get(response.id);
      if (activeGiveaway) {
        const winners = [...activeGiveaway.participants]
          .sort(() => 0.5 - Math.random())
          .slice(0, activeGiveaway.winnersCount);

        client.giveaways.delete(response.id);

        // Update storage status
        const stored = storage.get("giveaways", response.id);
        if (stored) {
          stored.status = "ended";
          storage.set("giveaways", response.id, stored);
        }

        const channel = await client.channels.fetch(interaction.channelId).catch(() => null);
        if (channel) {
          if (winners.length === 0) {
            await channel.send({
              flags: 1 << 15,
              components: [{
                type: 17,
                accent_color: 0xef4444,
                components: [
                  { type: 10, content: `# ${Emojis.resolve(client, "error", interaction.guildId)} Giveaway Concluded!` },
                  { type: 14 },
                  { type: 10, content: `**Reward:** ${prize}\n**Result:** No winners could be determined as no users entered the giveaway matrix.\n**Giveaway ID:** \`${response.id}\`` }
                ]
              }]
            });
            await logGiveaway("end", response.id, prize, { "Result": "No participants (scheduled)" });
          } else {
            // DM Winners
            for (const winnerId of winners) {
              const user = await client.users.fetch(winnerId).catch(() => null);
              if (user) {
                const guildName = (await client.guilds.fetch(interaction.guildId).catch(() => null))?.name || "a server";
                await user.send({
                  content: `${Emojis.resolve(client, "success", interaction.guildId)} Congratulations! You won the giveaway for **${prize}** in **${guildName}**!`
                }).catch(() => null);
              }
            }

            await channel.send({
              flags: 1 << 15,
              components: [{
                type: 17,
                accent_color: botConfig.embedColor ? parseInt(botConfig.embedColor, 16) : 0x10b981,
                components: [
                  { type: 10, content: `# ${Emojis.resolve(client, "success", interaction.guildId)} Giveaway Concluded!` },
                  { type: 14 },
                  { type: 10, content: `**Reward:** ${prize}\n**Winner(s):** ${winners.map(id => `<@${id}>`).join(", ")}\n**Giveaway ID:** \`${response.id}\`` }
                ]
              }]
            });
            await logGiveaway("end", response.id, prize, { "Winners": winners.length, "Source": "Scheduled" });
          }
        }
      }
    }, durationMs);
  }
};
