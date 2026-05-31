/**
 * @file core_commands/logging.js
 * @description Advanced command to manage system logging channels persistently.
 * Uses Discord Components V2 Containers, TextDisplays, and Separators.
 * 
 * © 2026 Cortex HQ & bot-hosting.net
 */

const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require("discord.js");
const Emojis = require("../config/emojis");
const storage = require("../utils/storage");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("logging")
    .setDescription("View and configure system logging channels.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
      sub.setName("status")
        .setDescription("View the active configuration of all system logging channels.")
    )
    .addSubcommand(sub =>
      sub.setName("set")
        .setDescription("Set a specific log channel.")
        .addStringOption(opt =>
          opt.setName("level")
            .setDescription("The log level to configure.")
            .setRequired(true)
            .addChoices(
              { name: "General (Fallback)", value: "general" },
              { name: "Information", value: "info" },
              { name: "Warnings", value: "warn" },
              { name: "Errors", value: "error" },
              { name: "Commands", value: "command" },
              { name: "Audit / Server Events", value: "audit" },
              { name: "Moderation Logs", value: "moderation" },
              { name: "Ticket Logs", value: "tickets" },
              { name: "Giveaway Logs", value: "giveaways" }
            )
        )
        .addChannelOption(opt =>
          opt.setName("channel")
            .setDescription("The channel to send logs to.")
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName("reset")
        .setDescription("Reset logging configuration for a specific level or all levels.")
        .addStringOption(opt =>
          opt.setName("level")
            .setDescription("The log level to reset.")
            .setRequired(true)
            .addChoices(
              { name: "All", value: "all" },
              { name: "General", value: "general" },
              { name: "Information", value: "info" },
              { name: "Warnings", value: "warn" },
              { name: "Errors", value: "error" },
              { name: "Commands", value: "command" },
              { name: "Audit / Server Events", value: "audit" },
              { name: "Moderation Logs", value: "moderation" },
              { name: "Ticket Logs", value: "tickets" },
              { name: "Giveaway Logs", value: "giveaways" }
            )
        )
    )
    .addSubcommand(sub =>
      sub.setName("toggle")
        .setDescription("Enable or disable specific log categories.")
        .addStringOption(opt =>
          opt.setName("category")
            .setDescription("The category to toggle.")
            .setRequired(true)
            .addChoices(
              { name: "All Logging", value: "all" },
              { name: "Moderation", value: "moderation" },
              { name: "Tickets", value: "tickets" },
              { name: "Giveaways", value: "giveaways" },
              { name: "Audit Messages", value: "messages" },
              { name: "Audit Members", value: "members" },
              { name: "Audit Server", value: "server" }
            )
        )
        .addBooleanOption(opt => opt.setName("enabled").setDescription("Status").setRequired(true))
    ),

  /**
   * Execute the logging command.
   * @param {import('discord.js').ChatInputCommandInteraction} interaction 
   * @param {import('discord.js').Client} client 
   */
  async execute(interaction, client) {
    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guildId;

    const botConfig = storage.get("bot_identity", guildId) || {};
    const botName = botConfig.displayName || process.env.BOT_NAME || "Bot";
    const accentColor = botConfig.embedColor ? parseInt(botConfig.embedColor, 16) : 0x10b981;

    if (subcommand === "set") {
      const level = interaction.options.getString("level");
      const channel = interaction.options.getChannel("channel");

      if (!channel.isTextBased()) {
        return interaction.reply({
          content: `${Emojis.resolve(client, "error", guildId)} **Invalid Channel:** Please select a text-based channel.`,
          flags: MessageFlags.Ephemeral
        });
      }

      const guildLogs = storage.get("logs", guildId) || {};
      guildLogs[level] = channel.id;
      storage.set("logs", guildId, guildLogs);

      return interaction.reply({
        flags: (1 << 15) | MessageFlags.Ephemeral,
        components: [{
          type: 17,
          accent_color: accentColor,
          components: [
            { type: 10, content: `# ${Emojis.resolve(client, "success", guildId)} Configuration Updated` },
            { type: 14 },
            { type: 10, content: `\`${level.toUpperCase()}\` logs will now be sent to <#${channel.id}>.` }
          ]
        }]
      });
    }

    if (subcommand === "reset") {
      const level = interaction.options.getString("level");
      const guildLogs = storage.get("logs", guildId) || {};

      if (level === "all") {
        storage.delete("logs", guildId);
      } else {
        delete guildLogs[level];
        storage.set("logs", guildId, guildLogs);
      }

      return interaction.reply({
        flags: (1 << 15) | MessageFlags.Ephemeral,
        components: [{
          type: 17,
          accent_color: accentColor,
          components: [
            { type: 10, content: `# ${Emojis.resolve(client, "success", guildId)} Configuration Reset` },
            { type: 14 },
            { type: 10, content: `\`${level.toUpperCase()}\` logging has been reset to defaults.` }
          ]
        }]
      });
    }

    if (subcommand === "toggle") {
      const category = interaction.options.getString("category");
      const enabled = interaction.options.getBoolean("enabled");
      const guildLogs = storage.get("logs", guildId) || {};

      if (category === "all") {
        botConfig.loggingEnabled = enabled;
        storage.set("bot_identity", guildId, botConfig);
      } else if (category === "messages" || category === "members" || category === "server") {
        guildLogs[`audit_${category}_enabled`] = enabled;
        storage.set("logs", guildId, guildLogs);
      } else {
        guildLogs[`${category}_enabled`] = enabled;
        storage.set("logs", guildId, guildLogs);
      }

      return interaction.reply({
        flags: (1 << 15) | MessageFlags.Ephemeral,
        components: [{
          type: 17,
          accent_color: accentColor,
          components: [
            { type: 10, content: `# ${Emojis.resolve(client, "success", guildId)} Category Updated` },
            { type: 14 },
            { type: 10, content: `\`${category.toUpperCase()}\` is now **${enabled ? "Enabled" : "Disabled"}**.` }
          ]
        }]
      });
    }

    // Default: status subcommand
    const guildLogs = storage.get("logs", guildId) || {};
    const auditLogId = process.env.AUDIT_LOG_CHANNEL_ID;
    const generalId = guildLogs.general || process.env.LOG_CHANNEL_ID;

    const formatStatus = (key, label) => {
      const channelId = guildLogs[key] || (key === "audit" ? auditLogId : generalId);
      const enabled = guildLogs[`${key}_enabled`] !== false;
      if (!channelId) return `• **${label}:** \`Disabled\``;
      return `• **${label}:** <#${channelId}> ${enabled ? "✅" : "❌"}`;
    };

    const auditStatus = (cat) => {
      const enabled = guildLogs[`audit_${cat}_enabled`] !== false;
      return enabled ? "✅" : "❌";
    };

    const overallLogging = botConfig.loggingEnabled !== false ? "✅ Enabled" : "❌ Disabled";

    const payload = {
      flags: 1 << 15,
      components: [
        {
          type: 17,
          accent_color: accentColor,
          components: [
            {
              type: 10,
              content: `# ${Emojis.resolve(client, "satellite", guildId)} ${botName} Logging Configuration Matrix`
            },
            { type: 14 },
            {
              type: 10,
              content: `**Global Status:** ${overallLogging}\n\n**Specialized Modules:**\n${formatStatus("moderation", "Moderation")}\n${formatStatus("tickets", "Tickets")}\n${formatStatus("giveaways", "Giveaways")}`
            },
            { type: 14 },
            {
              type: 10,
              content: `**Audit Categories:**\n• Messages: ${auditStatus("messages")}\n• Members: ${auditStatus("members")}\n• Server: ${auditStatus("server")}`
            },
            { type: 14 },
            {
              type: 10,
              content: `**Log Channels:**\n${formatStatus("info", "Information")}\n${formatStatus("warn", "Warnings")}\n${formatStatus("error", "Errors")}\n${formatStatus("command", "Commands")}\n${formatStatus("audit", "Audit")}`
            }
          ]
        }
      ]
    };

    await interaction.reply(payload);
  }
};
