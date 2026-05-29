/**
 * @file core_commands/help.js
 * @description The official /help slash command.
 * Dynamically lists all loaded application commands from client.commands,
 * formatting them using Discord Components V2 Container, TextDisplay, and Section components.
 * 
 * Discord Components V2 correct type map:
 *   Container   = type 17  (wraps everything with accent color bar)
 *   Section     = type 9   (grouping row within a container)
 *   TextDisplay = type 10  (renders markdown text content)
 *   Separator   = type 14  (horizontal divider)
 * 
 * © 2026 Cortex HQ & bot-hosting.net
 */

const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const Emojis = require("../config/emojis");

// Helper to resolve permission names from bitfield
function resolvePermissionName(bitfield) {
  if (!bitfield) return "Everyone";
  const permissions = Object.entries(PermissionFlagsBits);
  for (const [name, value] of permissions) {
    if (value === BigInt(bitfield)) {
      return name;
    }
  }
  return "Restricted";
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription(`View the interactive directory of all active ${process.env.BOT_NAME || "Bot"} commands.`),

  /**
   * Execute the help command.
   * @param {import('discord.js').ChatInputCommandInteraction} interaction 
   * @param {import('discord.js').Client} client 
   */
  async execute(interaction, client) {
    const botName = process.env.BOT_NAME || "Bot";

    // Dynamically build a TextDisplay component for each registered command
    const commandDisplays = client.commands.map(cmd => {
      const perms = resolvePermissionName(cmd.data.default_member_permissions);
      return {
        type: 10, // TextDisplay — renders markdown text inline
        content: `${Emojis.resolve(client, "satellite", interaction.guildId)} **/${cmd.data.name}** — ${cmd.data.description}\n> *Permission: \`${perms}\`*`
      };
    });

    // Construct the root Components V2 Container layout
    const payload = {
      // IS_COMPONENTS_V2 bitwise flag (1 << 15 = 32768) forces the Discord client
      // to render this message using the next-generation component layout engine.
      flags: 1 << 15,
      components: [
        {
          type: 17, // Container — root wrapper with optional accent color bar
          accent_color: 0x3b82f6, // Accent line (hex integer)
          components: [
            {
              type: 10, // TextDisplay — header block
              content: `# ${Emojis.resolve(client, "web", interaction.guildId)} ${botName} Command Directory\nDiscover the loaded command matrix below and get started:`
            },
            {
              type: 14 // Separator — horizontal divider between header and command list
            },
            ...commandDisplays
          ]
        }
      ]
    };

    await interaction.reply(payload);
  }
};

