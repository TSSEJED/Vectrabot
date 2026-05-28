/**
 * @file core_commands/support.js
 * @description The official /support slash command.
 * Connects host customers directly to technical assistance resources using
 * Components V2 Containers, TextDisplays, and side-by-side Link Buttons (style 5).
 * 
 * Discord Components V2 correct type map:
 *   Container   = type 17  (wraps everything with accent color bar)
 *   TextDisplay = type 10  (renders markdown text content)
 *   ActionRow   = type 1   (required wrapper for interactive elements like buttons)
 *   Button      = type 2   (style 5 = Link button opening external URL)
 * 
 * © 2026 Cortex HQ & bot-hosting.net
 */

const { SlashCommandBuilder } = require("discord.js");
const Emojis = require("../config/emojis");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("support")
    .setDescription("Access technical support resources from Cortex HQ and bot-hosting.net."),

  /**
   * Execute the support command.
   * @param {import('discord.js').ChatInputCommandInteraction} interaction 
   * @param {import('discord.js').Client} client 
   */
  async execute(interaction, client) {
    const botName = process.env.BOT_NAME || "Bot";

    const payload = {
      // IS_COMPONENTS_V2 bitwise flag (1 << 15 = 32768) forces the Discord client
      // to render this message using the next-generation component layout engine.
      flags: 1 << 15,
      components: [
        {
          type: 17, // Container — root wrapper with accent color bar
          accent_color: 0xf59e0b, // Cortex Amber accent line (hex integer)
          components: [
            {
              type: 10, // TextDisplay — header block
              content: `# ${Emojis.global.support} Cortex HQ Partnership Support Matrix\nNeed assistance with your ${botName} template or hosting setup? Select a service resource below for immediate connection:`
            },
            {
              type: 14 // Separator — horizontal divider before action buttons
            },
            {
              type: 1, // ActionRow — required wrapper for interactive button components
              components: [
                {
                  type: 2,    // Button component
                  style: 5,   // Link style — opens an external URL (no custom_id needed)
                  label: "Cortex HQ Support",
                  url: "https://sejed.dev/support-cortex", // Placeholder technical assistance URL
                  emoji: { name: "🤝" }
                },
                {
                  type: 2,    // Button component
                  style: 5,   // Link style — opens an external URL
                  label: "bot-hosting.net Billing",
                  url: "https://bot-hosting.net/dashboard", // Placeholder server billing dashboard
                  emoji: { name: "🖥️" }
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

