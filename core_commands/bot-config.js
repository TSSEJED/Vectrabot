/**
 * @file core_commands/bot-config.js
 * @description Command to manage general bot identity settings for the server.
 *
 * © 2026 Cortex HQ & bot-hosting.net
 */

const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, EmbedBuilder } = require("discord.js");
const Emojis = require("../config/emojis");
const storage = require("../utils/storage");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("bot-config")
    .setDescription("Manage bot identity settings for this server.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
      sub.setName("set-name")
        .setDescription("Set a custom display name for the bot in this server.")
        .addStringOption(opt => opt.setName("name").setDescription("The new display name.").setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName("set-color")
        .setDescription("Set a custom embed accent color for the bot in this server.")
        .addStringOption(opt => opt.setName("color").setDescription("The hex color code (e.g. #3b82f6).").setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName("status")
        .setDescription("View current bot configuration.")
    )
    .addSubcommand(sub =>
      sub.setName("reset")
        .setDescription("Reset bot configuration to global defaults.")
    ),

  /**
   * Execute the bot-config command.
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   * @param {import('discord.js').Client} client
   */
  async execute(interaction, client) {
    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guildId;
    const config = storage.get("bot_identity", guildId) || {};

    if (subcommand === "set-name") {
      const name = interaction.options.getString("name");
      config.displayName = name;
      storage.set("bot_identity", guildId, config);

      return interaction.reply({
        content: `${Emojis.resolve(client, "success", guildId)} **Bot Name Updated:** The bot will now identify as **${name}** in this server.`,
        flags: MessageFlags.Ephemeral
      });
    }

    if (subcommand === "set-color") {
      const color = interaction.options.getString("color");
      if (!color.match(/^#?[0-9a-fA-F]{6}$/)) {
        return interaction.reply({
          content: `${Emojis.resolve(client, "error", guildId)} **Invalid Color:** Please provide a valid hex color code (e.g. #3b82f6).`,
          flags: MessageFlags.Ephemeral
        });
      }
      config.embedColor = color.replace("#", "");
      storage.set("bot_identity", guildId, config);

      return interaction.reply({
        content: `${Emojis.resolve(client, "success", guildId)} **Bot Color Updated:** Embeds will now use the color \`#${config.embedColor}\` in this server.`,
        flags: MessageFlags.Ephemeral
      });
    }

    if (subcommand === "reset") {
      storage.delete("bot_identity", guildId);
      return interaction.reply({
        content: `${Emojis.resolve(client, "success", guildId)} **Bot Configuration Reset:** Global template defaults restored.`,
        flags: MessageFlags.Ephemeral
      });
    }

    if (subcommand === "status") {
      const currentName = config.displayName || process.env.BOT_NAME || "Vectrabot";
      const currentColor = config.embedColor ? `#${config.embedColor}` : "#3b82f6";

      const embed = new EmbedBuilder()
        .setColor(config.embedColor ? parseInt(config.embedColor, 16) : 0x3b82f6)
        .setTitle(`${Emojis.resolve(client, "satellite", guildId)} Bot Identity Status`)
        .addFields(
          { name: "Display Name", value: `\`${currentName}\``, inline: true },
          { name: "Embed Color", value: `\`${currentColor}\``, inline: true }
        )
        .setFooter({ text: "Use /bot-config set-name or set-color to change these settings." })
        .setTimestamp();

      return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }
  }
};
