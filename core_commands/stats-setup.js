/**
 * @file core_commands/stats-setup.js
 * @description Admin command to configure the Server Stats display system.
 *
 * © 2026 Cortex HQ & bot-hosting.net
 */

const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, EmbedBuilder } = require("discord.js");
const Emojis = require("../config/emojis");
const storage = require("../utils/storage");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("server-stats")
    .setDescription("Configure real-time server statistics channels.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
      sub.setName("setup")
        .setDescription("Assign a channel to a specific statistic.")
        .addStringOption(opt =>
          opt.setName("type")
            .setDescription("The type of statistic to display.")
            .setRequired(true)
            .addChoices(
              { name: "Total Members", value: "total" },
              { name: "Human Count", value: "humans" },
              { name: "Bot Count", value: "bots" },
              { name: "Role Count", value: "roles" }
            )
        )
        .addChannelOption(opt =>
          opt.setName("channel")
            .setDescription("The channel whose name will be updated.")
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName("toggle")
        .setDescription("Enable or disable the stats system.")
        .addBooleanOption(opt => opt.setName("enabled").setDescription("Status").setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName("status")
        .setDescription("View current stats configuration.")
    )
    .addSubcommand(sub =>
      sub.setName("reset")
        .setDescription("Clear all stats configuration.")
    ),

  /**
   * Execute the stats configuration command.
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   * @param {import('discord.js').Client} client
   */
  async execute(interaction, client) {
    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guildId;
    const config = storage.get("server_stats", guildId) || { enabled: false, channels: {} };

    if (subcommand === "setup") {
      const type = interaction.options.getString("type");
      const channel = interaction.options.getChannel("channel");

      config.channels[type] = channel.id;
      storage.set("server_stats", guildId, config);

      return interaction.reply({
        content: `${Emojis.resolve(client, "success", guildId)} **Channel Linked:** <#${channel.id}> will now display **${type.toUpperCase()}** stats.`,
        flags: MessageFlags.Ephemeral
      });
    }

    if (subcommand === "toggle") {
      config.enabled = interaction.options.getBoolean("enabled");
      storage.set("server_stats", guildId, config);

      return interaction.reply({
        content: `${Emojis.resolve(client, "success", guildId)} **Server Stats System** is now **${config.enabled ? "Enabled" : "Disabled"}**.`,
        flags: MessageFlags.Ephemeral
      });
    }

    if (subcommand === "reset") {
      storage.delete("server_stats", guildId);
      return interaction.reply({
        content: `${Emojis.resolve(client, "success", guildId)} **Server Stats Configuration Reset.**`,
        flags: MessageFlags.Ephemeral
      });
    }

    if (subcommand === "status") {
      const channels = config.channels || {};
      const botConfig = storage.get("bot_identity", guildId) || {};

      const embed = new EmbedBuilder()
        .setColor(botConfig.embedColor ? parseInt(botConfig.embedColor, 16) : 0x3b82f6)
        .setTitle(`${Emojis.resolve(client, "web", guildId)} Server Stats Configuration`)
        .setDescription(`**Global Status:** ${config.enabled ? "✅ Enabled" : "❌ Disabled"}`)
        .addFields(
          { name: "📊 Total Members", value: channels.total ? `<#${channels.total}>` : "`Not Linked`", inline: true },
          { name: "👥 Humans", value: channels.humans ? `<#${channels.humans}>` : "`Not Linked`", inline: true },
          { name: "🤖 Bots", value: channels.bots ? `<#${channels.bots}>` : "`Not Linked`", inline: true },
          { name: "🔐 Roles", value: channels.roles ? `<#${channels.roles}>` : "`Not Linked`", inline: true }
        )
        .setTimestamp();

      return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }
  }
};
