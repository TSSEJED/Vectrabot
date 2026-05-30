/**
 * @file core_commands/emoji-config.js
 * @description Comprehensive emoji configuration command.
 *
 * © 2026 Cortex HQ & bot-hosting.net
 */

const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, EmbedBuilder } = require("discord.js");
const Emojis = require("../config/emojis");
const storage = require("../utils/storage");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("emoji")
    .setDescription("Configure custom and global emojis for this server.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
      sub.setName("toggle")
        .setDescription("Enable or disable custom emojis for this server.")
        .addBooleanOption(opt => opt.setName("enabled").setDescription("Whether custom emojis should be enabled.").setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName("set")
        .setDescription("Set a specific custom emoji for a bot action.")
        .addStringOption(opt =>
          opt.setName("key")
            .setDescription("The action/status to map.")
            .setRequired(true)
            .addChoices(
              { name: "Success", value: "success" },
              { name: "Error", value: "error" },
              { name: "Loading", value: "loading" },
              { name: "Info", value: "info" },
              { name: "Support", value: "support" },
              { name: "Links", value: "links" },
              { name: "Network", value: "network" },
              { name: "Web", value: "web" },
              { name: "Satellite", value: "satellite" },
              { name: "Hardware", value: "hardware" },
              { name: "Refresh", value: "refresh" }
            )
        )
        .addStringOption(opt =>
          opt.setName("emoji")
            .setDescription("The custom emoji (e.g. <:name:id>).")
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName("status")
        .setDescription("View current emoji configuration and mappings.")
    )
    .addSubcommand(sub =>
      sub.setName("reset")
        .setDescription("Reset all custom emoji mappings to template defaults.")
    ),

  /**
   * Execute the emoji configuration command.
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   * @param {import('discord.js').Client} client
   */
  async execute(interaction, client) {
    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guildId;

    if (subcommand === "toggle") {
      const enabled = interaction.options.getBoolean("enabled");
      storage.set("settings", `custom_emojis_${guildId}`, enabled);
      return interaction.reply({
        content: `${Emojis.resolve(client, enabled ? "success" : "error", guildId)} **Custom Emojis ${enabled ? "Enabled" : "Disabled"}:** The bot will now use ${enabled ? "custom" : "global"} emojis.`,
        flags: MessageFlags.Ephemeral
      });
    }

    if (subcommand === "set") {
      const key = interaction.options.getString("key");
      const emojiString = interaction.options.getString("emoji");

      // Validate emoji format
      if (!emojiString.match(/<a?:\w+:\d+>/) && !emojiString.match(/\p{Emoji}/u)) {
        return interaction.reply({
          content: `${Emojis.resolve(client, "error", guildId)} **Invalid Emoji:** Please provide a valid Discord custom emoji or Unicode character.`,
          flags: MessageFlags.Ephemeral
        });
      }

      const guildEmojis = storage.get("custom_emoji_mappings", guildId) || {};
      guildEmojis[key] = emojiString;
      storage.set("custom_emoji_mappings", guildId, guildEmojis);

      return interaction.reply({
        content: `${Emojis.resolve(client, "success", guildId)} **Emoji Updated:** Action \`${key}\` is now mapped to ${emojiString}.`,
        flags: MessageFlags.Ephemeral
      });
    }

    if (subcommand === "reset") {
      storage.delete("custom_emoji_mappings", guildId);
      return interaction.reply({
        content: `${Emojis.resolve(client, "success", guildId)} **Emoji Mappings Reset:** All emojis returned to template defaults.`,
        flags: MessageFlags.Ephemeral
      });
    }

    if (subcommand === "status") {
      const customEnabled = storage.get("settings", `custom_emojis_${guildId}`) !== false;
      const guildMappings = storage.get("custom_emoji_mappings", guildId) || {};

      const embed = new EmbedBuilder()
        .setColor(0x3b82f6)
        .setTitle(`${Emojis.resolve(client, "web", guildId)} Emoji System Status`)
        .setDescription(`**Custom Emojis Status:** ${customEnabled ? "✅ Enabled" : "❌ Disabled"}`)
        .addFields({
          name: "📍 Active Mappings",
          value: Object.keys(Emojis.global).map(key => {
            const current = Emojis.resolve(client, key, guildId);
            const isOverridden = guildMappings[key] ? "*(Overridden)*" : "";
            return `• **${key}:** ${current} ${isOverridden}`;
          }).join("\n")
        })
        .setFooter({ text: "Use /emoji set to override specific icons." })
        .setTimestamp();

      return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }
  }
};
