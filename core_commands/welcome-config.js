/**
 * @file core_commands/welcome-config.js
 * @description Advanced configuration command for the welcome and goodbye system.
 *
 * © 2026 Cortex HQ & bot-hosting.net
 */

const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, EmbedBuilder } = require("discord.js");
const Emojis = require("../config/emojis");
const storage = require("../utils/storage");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("welcome")
    .setDescription("Configure the advanced welcome and goodbye system.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    // Welcome Subcommands
    .addSubcommand(sub =>
      sub.setName("set-channel")
        .setDescription("Set the channel for welcome messages.")
        .addChannelOption(opt => opt.setName("channel").setDescription("The channel to broadcast welcomes.").setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName("message")
        .setDescription("Set the custom welcome message.")
        .addStringOption(opt => opt.setName("text").setDescription("Placeholders: {user}, {username}, {server}, {memberCount}").setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName("toggle")
        .setDescription("Enable or disable welcome messages.")
        .addBooleanOption(opt => opt.setName("enabled").setDescription("Status").setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName("dm-toggle")
        .setDescription("Enable or disable private DM welcome messages.")
        .addBooleanOption(opt => opt.setName("enabled").setDescription("Status").setRequired(true))
    )
    // Goodbye Subcommands
    .addSubcommand(sub =>
      sub.setName("goodbye-toggle")
        .setDescription("Enable or disable goodbye messages.")
        .addBooleanOption(opt => opt.setName("enabled").setDescription("Status").setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName("goodbye-message")
        .setDescription("Set the custom goodbye message.")
        .addStringOption(opt => opt.setName("text").setDescription("Placeholders: {user}, {username}, {server}, {memberCount}").setRequired(true))
    )
    // Preview
    .addSubcommand(sub =>
      sub.setName("status")
        .setDescription("View the current welcome/goodbye configuration.")
    ),

  /**
   * Execute the welcome configuration command.
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   * @param {import('discord.js').Client} client
   */
  async execute(interaction, client) {
    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guildId;
    const config = storage.get("welcome", guildId) || { enabled: false, goodbyeEnabled: false };

    if (subcommand === "set-channel") {
      const channel = interaction.options.getChannel("channel");
      if (!channel.isTextBased()) {
        return interaction.reply({ content: `${Emojis.resolve(client, "error", guildId)} Please select a text channel.`, flags: MessageFlags.Ephemeral });
      }
      config.channelId = channel.id;
      storage.set("welcome", guildId, config);
      return interaction.reply({ content: `${Emojis.resolve(client, "success", guildId)} Welcome messages will now be sent to <#${channel.id}>.`, flags: MessageFlags.Ephemeral });
    }

    if (subcommand === "message") {
      config.welcomeMessage = interaction.options.getString("text");
      storage.set("welcome", guildId, config);
      return interaction.reply({ content: `${Emojis.resolve(client, "success", guildId)} Welcome message updated.`, flags: MessageFlags.Ephemeral });
    }

    if (subcommand === "toggle") {
      config.enabled = interaction.options.getBoolean("enabled");
      storage.set("welcome", guildId, config);
      return interaction.reply({ content: `${Emojis.resolve(client, "success", guildId)} Welcome system is now **${config.enabled ? "Enabled" : "Disabled"}**.`, flags: MessageFlags.Ephemeral });
    }

    if (subcommand === "dm-toggle") {
      config.dmEnabled = interaction.options.getBoolean("enabled");
      storage.set("welcome", guildId, config);
      return interaction.reply({ content: `${Emojis.resolve(client, "success", guildId)} DM welcomes are now **${config.dmEnabled ? "Enabled" : "Disabled"}**.`, flags: MessageFlags.Ephemeral });
    }

    if (subcommand === "goodbye-toggle") {
      config.goodbyeEnabled = interaction.options.getBoolean("enabled");
      storage.set("welcome", guildId, config);
      return interaction.reply({ content: `${Emojis.resolve(client, "success", guildId)} Goodbye system is now **${config.goodbyeEnabled ? "Enabled" : "Disabled"}**.`, flags: MessageFlags.Ephemeral });
    }

    if (subcommand === "goodbye-message") {
      config.goodbyeMessage = interaction.options.getString("text");
      storage.set("welcome", guildId, config);
      return interaction.reply({ content: `${Emojis.resolve(client, "success", guildId)} Goodbye message updated.`, flags: MessageFlags.Ephemeral });
    }

    if (subcommand === "status") {
      const botConfig = storage.get("bot_identity", guildId) || {};

      const embed = new EmbedBuilder()
        .setColor(botConfig.embedColor ? parseInt(botConfig.embedColor, 16) : 0x3b82f6)
        .setTitle(`${Emojis.resolve(client, "web", guildId)} Welcome System Configuration`)
        .addFields(
          {
            name: "👋 Welcome Module",
            value: `• **Status:** ${config.enabled ? "✅ Enabled" : "❌ Disabled"}\n• **Channel:** ${config.channelId ? `<#${config.channelId}>` : "`Not Set`"}\n• **DM Welcome:** ${config.dmEnabled ? "✅ Enabled" : "❌ Disabled"}`,
            inline: false
          },
          {
            name: "📝 Welcome Message",
            value: `\`\`\`${config.welcomeMessage || "Default"}\`\`\``,
            inline: false
          },
          {
            name: "🏃 Goodbye Module",
            value: `• **Status:** ${config.goodbyeEnabled ? "✅ Enabled" : "❌ Disabled"}\n• **Channel:** ${config.channelId ? `<#${config.channelId}>` : "`Not Set`"}`,
            inline: false
          },
          {
            name: "📝 Goodbye Message",
            value: `\`\`\`${config.goodbyeMessage || "Default"}\`\`\``,
            inline: false
          }
        )
        .setFooter({ text: "Use placeholders like {user} and {server} in messages." })
        .setTimestamp();

      return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }
  }
};
