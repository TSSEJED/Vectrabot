/**
 * @file core_commands/emoji-toggle.js
 * @description Admin command to toggle between custom and global emojis.
 *
 * © 2026 Cortex HQ & bot-hosting.net
 */

const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require("discord.js");
const Emojis = require("../config/emojis");
const storage = require("../utils/storage");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("emoji-toggle")
    .setDescription("Toggle between custom and global emojis for this server.")
    .addBooleanOption(opt =>
      opt.setName("enabled")
        .setDescription("Whether custom emojis should be enabled.")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  /**
   * Execute the emoji-toggle command.
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   * @param {import('discord.js').Client} client
   */
  async execute(interaction, client) {
    const enabled = interaction.options.getBoolean("enabled");
    const guildId = interaction.guildId;

    if (!guildId) {
      return interaction.reply({
        content: `${Emojis.global.error} This command can only be used in a server.`,
        flags: MessageFlags.Ephemeral
      });
    }

    storage.set("settings", `custom_emojis_${guildId}`, enabled);

    const status = enabled ? "Enabled" : "Disabled";
    const emoji = Emojis.resolve(client, enabled ? "success" : "error", guildId);

    await interaction.reply({
      content: `${emoji} **Custom Emojis ${status}:** The bot will now use ${enabled ? "custom" : "global"} emojis in this server.`,
      flags: MessageFlags.Ephemeral
    });
  }
};
