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
              { name: "Audit / Server Events", value: "audit" }
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
              { name: "Audit / Server Events", value: "audit" }
            )
        )
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
        content: `${Emojis.resolve(client, "success", guildId)} **Configuration Updated:** \`${level.toUpperCase()}\` logs will now be sent to <#${channel.id}>.`,
        flags: MessageFlags.Ephemeral
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
        content: `${Emojis.resolve(client, "success", guildId)} **Configuration Reset:** \`${level.toUpperCase()}\` logging has been reset to defaults.`,
        flags: MessageFlags.Ephemeral
      });
    }

    // Default: status subcommand
    // Check persistent config first
    const guildLogs = storage.get("logs", guildId) || {};

    // Fallback to environment variables
    const auditLogId = process.env.AUDIT_LOG_CHANNEL_ID;

    // Fallback to environment variables
    const generalId = guildLogs.general || process.env.LOG_CHANNEL_ID;
    const infoId = guildLogs.info || process.env.INFO_LOG_CHANNEL_ID;
    const warnId = guildLogs.warn || process.env.WARN_LOG_CHANNEL_ID;
    const errorId = guildLogs.error || process.env.ERROR_LOG_CHANNEL_ID;
    const commandId = guildLogs.command || process.env.COMMAND_LOG_CHANNEL_ID;
    const auditId = guildLogs.audit || auditLogId;

    // Helper to format channel status text cleanly
    const formatStatus = (channelId, label) => {
      if (!channelId) {
        return `${Emojis.resolve(client, "error", guildId)} **${label} Log Channel:** \`Disabled\` (Console Only)`;
      }
      return `${Emojis.resolve(client, "satellite", guildId)} **${label} Log Channel:** <#${channelId}> (\`${channelId}\`)`;
    };

    const generalStatus = generalId 
      ? `${Emojis.resolve(client, "web", guildId)} **Fallback Log Channel:** <#${generalId}> (\`${generalId}\`)`
      : `${Emojis.resolve(client, "error", guildId)} **Fallback Log Channel:** \`Disabled\``;

    const payload = {
      flags: 1 << 15,
      components: [
        {
          type: 17, // Container
          accent_color: botConfig.embedColor ? parseInt(botConfig.embedColor, 16) : 0x10b981, // Premium Emerald Accent line
          components: [
            {
              type: 10, // TextDisplay
              content: `# ${Emojis.resolve(client, "satellite", guildId)} ${botName} Logging Configuration Matrix\nConfigure level-specific log channels persistently for this guild.`
            },
            {
              type: 14 // Separator
            },
            {
              type: 10, // TextDisplay - general fallback status
              content: generalStatus
            },
            {
              type: 14 // Separator
            },
            {
              type: 10, // TextDisplay - Info
              content: formatStatus(infoId || generalId, "INFO")
            },
            {
              type: 10, // TextDisplay - Warn
              content: formatStatus(warnId || generalId, "WARN")
            },
            {
              type: 10, // TextDisplay - Error
              content: formatStatus(errorId || generalId, "ERROR")
            },
            {
              type: 10, // TextDisplay - Command
              content: formatStatus(commandId || generalId, "COMMAND")
            },
            {
              type: 10, // TextDisplay - Audit
              content: formatStatus(auditId || generalId, "AUDIT")
            }
          ]
        }
      ]
    };

    await interaction.reply(payload);
  }
};
