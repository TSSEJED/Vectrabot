/**
 * @file core_commands/website.js
 * @description Provides links to the official Vectrabot Core website and documentation.
 *
 * © 2026 Cortex HQ & bot-hosting.net
 */

const { SlashCommandBuilder } = require("discord.js");
const Emojis = require("../config/emojis");
const storage = require("../utils/storage");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("website")
    .setDescription("Access the official Vectrabot Core website and documentation.")
    .addStringOption(opt =>
      opt.setName("page")
        .setDescription("Directly link to a specific page.")
        .setRequired(false)
        .addChoices(
          { name: "🏠 Home", value: "home" },
          { name: "🚀 Features", value: "features" },
          { name: "📜 Commands", value: "commands" },
          { name: "📚 Documentation", value: "docs" },
          { name: "🔄 Changelog", value: "changelog" },
          { name: "🔒 Privacy", value: "privacy" }
        )
    ),

  /**
   * Execute the website command.
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   * @param {import('discord.js').Client} client
   */
  async execute(interaction, client) {
    const guildId = interaction.guildId;
    const botConfig = storage.get("bot_identity", guildId) || {};
    const botName = botConfig.displayName || process.env.BOT_NAME || "Vectrabot";
    const pageInput = interaction.options.getString("page") || "home";
    const page = pageInput === "home" ? "" : pageInput;

    // Website URL (can be customized via env in the future, placeholder for now)
    const baseUrl = process.env.WEBSITE_URL || "https://vectrabot-core.bot-hosting.net";
    const targetUrl = page ? `${baseUrl}/${page}` : baseUrl;

    const payload = {
      flags: 1 << 15, // IS_COMPONENTS_V2 bitwise flag
      components: [
        {
          type: 17, // Container
          accent_color: botConfig.embedColor ? parseInt(botConfig.embedColor, 16) : 0x3b82f6,
          components: [
            {
              type: 10, // TextDisplay
              content: `# ${Emojis.resolve(client, "web", guildId)} ${botName} Official Matrix\nSelect a link below to access our centralized information hub:`
            },
            {
              type: 14 // Separator
            },
            {
              type: 1, // ActionRow
              components: [
                {
                  type: 2,
                  style: 5,
                  label: "Open Website",
                  url: targetUrl,
                  emoji: { name: "🖥️" }
                },
                {
                  type: 2,
                  style: 5,
                  label: "Technical Docs",
                  url: `${baseUrl}/docs`,
                  emoji: { name: "📚" }
                }
              ]
            }
          ]
        }
      ]
    };

    await interaction.reply(payload);
  }
};
