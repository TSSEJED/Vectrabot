/**
 * @file addons/giveaways/giveaway.js
 * @description Official /giveaway advanced command suite.
 * Orchestrates the creation and broadcasting of advanced server giveaways
 * utilizing Discord Components V2 Containers and TextDisplays.
 *
 * © 2026 Cortex HQ & bot-hosting.net
 */

const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
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

    if (subcommand === "end") {
      const messageId = interaction.options.getString("id");
      const giveaway = client.giveaways.get(messageId);

      if (!giveaway) {
        return interaction.reply({
          content: `${Emojis.resolve(client, "error", interaction.guildId)} **System Error:** No active giveaway found with ID \`${messageId}\`.`,
          ephemeral: true
        });
      }

      const participants = giveaway.participants;
      if (!participants || participants.size === 0) {
        client.giveaways.delete(messageId);
        storage.delete("giveaways", messageId);
        return interaction.reply({
          content: `${Emojis.resolve(client, "error", interaction.guildId)} **Giveaway Terminated:** No participants synchronized with matrix \`${messageId}\`.`,
          ephemeral: true
        });
      }

      const winners = [...participants]
        .sort(() => 0.5 - Math.random())
        .slice(0, giveaway.winnersCount);

      client.giveaways.delete(messageId);
      storage.delete("giveaways", messageId);

      return interaction.reply({
        content: `${Emojis.resolve(client, "success", interaction.guildId)} **Giveaway Concluded!**\nReward: **${giveaway.prize}**\nWinner(s): ${winners.map(id => `<@${id}>`).join(", ")}\nMatrix ID: \`${messageId}\``
      });
    }

    if (subcommand === "reroll") {
      const messageId = interaction.options.getString("id");
      // In this advanced version, we can reroll finished giveaways if they are in storage
      // but usually we reroll active or just finished ones.
      // For simplicity, let's allow rerolling from the current participants if the giveaway is still in memory or recently ended.
      // However, the task says "update the giveaway system to be more advanced".

      const giveaway = client.giveaways.get(messageId) || storage.get("giveaways", messageId);

      if (!giveaway) {
        return interaction.reply({
          content: `${Emojis.resolve(client, "error", interaction.guildId)} **System Error:** No giveaway data found for ID \`${messageId}\`.`,
          ephemeral: true
        });
      }

      const participants = giveaway.participants instanceof Set ? [...giveaway.participants] : (giveaway.participants || []);
      if (participants.length === 0) {
        return interaction.reply({
          content: `${Emojis.resolve(client, "error", interaction.guildId)} **Reroll Failed:** No participants found for matrix \`${messageId}\`.`,
          ephemeral: true
        });
      }

      const winner = participants[Math.floor(Math.random() * participants.length)];

      return interaction.reply({
        content: `${Emojis.resolve(client, "refresh", interaction.guildId)} **Giveaway Rerolled!**\nNew Winner: <@${winner}>\nMatrix ID: \`${messageId}\``
      });
    }

    if (subcommand !== "start") return;

    const prize = interaction.options.getString("prize");
    const winnersCount = interaction.options.getInteger("winners");
    const durationInput = interaction.options.getString("duration");

    // Simple duration parser logic
    const msMap = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
    const match = durationInput.match(/^(\d+)([smhd])$/);

    if (!match) {
      return interaction.reply({
        content: `${Emojis.resolve(client, "error", interaction.guildId)} **Invalid Duration:** Please use a valid format (e.g., \`10m\`, \`1h\`, \`2d\`).`,
        ephemeral: true
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
              content: `# ${Emojis.resolve(client, "support", interaction.guildId)} New Giveaway Initialized!\nParticipate in the active matrix below for a chance to win.`
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

    const response = await interaction.reply({ ...payload, fetchReply: true });

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

    client.logger.info(`Giveaway started by ${interaction.user.tag} with ID ${response.id} for: ${prize}`);

    // Schedule end
    setTimeout(async () => {
      const activeGiveaway = client.giveaways.get(response.id);
      if (activeGiveaway) {
        // Trigger end logic (can be refactored into a helper function)
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
          await channel.send({
            content: `${Emojis.resolve(client, "success", interaction.guildId)} **Giveaway Concluded!**\nReward: **${prize}**\nWinner(s): ${winners.map(id => `<@${id}>`).join(", ")}\nMatrix ID: \`${response.id}\``
          });
        }
      }
    }, durationMs);
  }
};
