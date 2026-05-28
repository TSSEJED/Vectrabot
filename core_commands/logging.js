/**
 * @file core_commands/logging.js
 * @description Command to check active log channel configurations and verify setup.
 * Uses Discord Components V2 Containers, TextDisplays, and Separators.
 * 
 * © 2026 Cortex HQ & bot-hosting.net
 */

const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const Emojis = require("../config/emojis");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("logging")
    .setDescription("View the active configuration of all system logging channels.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator), // Admin-only security constraint

  /**
   * Execute the logging check command.
   * @param {import('discord.js').ChatInputCommandInteraction} interaction 
   * @param {import('discord.js').Client} client 
   */
  async execute(interaction, client) {
    const botName = process.env.BOT_NAME || "Bot";
    
    // Check configured environment channels
    const generalId = process.env.LOG_CHANNEL_ID;
    const infoId = process.env.INFO_LOG_CHANNEL_ID;
    const warnId = process.env.WARN_LOG_CHANNEL_ID;
    const errorId = process.env.ERROR_LOG_CHANNEL_ID;
    const commandId = process.env.COMMAND_LOG_CHANNEL_ID;

    // Helper to format channel status text cleanly
    const formatStatus = (channelId, label) => {
      if (!channelId) {
        return `${Emojis.global.error} **${label} Log Channel:** \`Disabled\` (Console Only)`;
      }
      return `${Emojis.global.satellite} **${label} Log Channel:** <#${channelId}> (\`${channelId}\`)`;
    };

    const generalStatus = generalId 
      ? `${Emojis.global.web} **Fallback Log Channel:** <#${generalId}> (\`${generalId}\`)` 
      : `${Emojis.global.error} **Fallback Log Channel:** \`Disabled\``;

    const payload = {
      // Bitwise flag (1 << 15) forces next-gen component rendering
      flags: 1 << 15,
      components: [
        {
          type: 17, // Container
          accent_color: 0x10b981, // Premium Emerald Accent line
          components: [
            {
              type: 10, // TextDisplay
              content: `# ${Emojis.global.satellite} ${botName} Logging Configuration Matrix\nConfigure level-specific log channels in your \`.env\` file. If a level-specific channel is empty, it falls back to the general channel. If both are empty, that log level is disabled for Discord broadcasts.`
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
            }
          ]
        }
      ]
    };

    await interaction.reply(payload);
  }
};
