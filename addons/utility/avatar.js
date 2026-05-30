/**
 * @file addons/avatar.js
 * @description Slash command to extract and render a user's global or guild-specific avatar.
 * Supports format selection (PNG, JPEG, WebP) and resolution arguments.
 * 
 * © 2026 Cortex HQ & bot-hosting.net
 */

const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require("discord.js");
const Emojis = require("../../config/emojis");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("avatar")
    .setDescription("Extracts and renders a target user's profile picture or guild avatar.")
    .addUserOption(option =>
      option.setName("target")
        .setDescription("The user whose avatar to fetch. Defaults to yourself.")
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName("format")
        .setDescription("Image format to render (default: WebP).")
        .setRequired(false)
        .addChoices(
          { name: "PNG", value: "png" },
          { name: "JPEG", value: "jpg" },
          { name: "WebP", value: "webp" },
          { name: "GIF (animated only)", value: "gif" }
        )
    )
    .addIntegerOption(option =>
      option.setName("size")
        .setDescription("Pixel resolution to render (default: 1024).")
        .setRequired(false)
        .addChoices(
          { name: "64px", value: 64 },
          { name: "128px", value: 128 },
          { name: "256px", value: 256 },
          { name: "512px", value: 512 },
          { name: "1024px (default)", value: 1024 },
          { name: "2048px", value: 2048 },
          { name: "4096px", value: 4096 }
        )
    ),

  /**
   * Execute the avatar command.
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   * @param {import('discord.js').Client} client
   */
  async execute(interaction, client) {
    const targetUser = interaction.options.getUser("target") || interaction.user;
    const format = interaction.options.getString("format") || "webp";
    const size = interaction.options.getInteger("size") || 1024;

    // Force-fetch the user to hydrate banner and decoration fields from REST API
    const fetchedUser = await client.users.fetch(targetUser.id, { force: true }).catch(() => targetUser);

    // Determine if the avatar is animated (GIF) to default to GIF format automatically
    const isAnimated = fetchedUser.avatar && fetchedUser.avatar.startsWith("a_");
    const resolvedFormat = isAnimated && format === "gif" ? "gif" : format;

    // 1. Global avatar URL — registered at the account level
    const globalAvatarUrl = fetchedUser.displayAvatarURL({ extension: resolvedFormat, size, forceStatic: false });

    // 2. Guild-specific avatar URL — overrides global avatar within this server only
    let guildAvatarUrl = null;
    if (interaction.guild) {
      const member = interaction.guild.members.cache.get(fetchedUser.id)
        || await interaction.guild.members.fetch(fetchedUser.id).catch(() => null);
      if (member && member.avatar) {
        guildAvatarUrl = member.displayAvatarURL({ extension: resolvedFormat, size, forceStatic: false });
      }
    }

    const embed = new EmbedBuilder()
      .setColor(0x3b82f6)
      .setTitle(`${Emojis.resolve(client, "web", interaction.guildId)} Avatar — ${fetchedUser.username}`)
      .setDescription(
        `**Viewing:** \`${resolvedFormat.toUpperCase()}\` at \`${size}px\`\n` +
        `**Animated:** \`${isAnimated ? "Yes" : "No"}\`\n\n` +
        `🔗 [Global Avatar URL](${globalAvatarUrl})` +
        (guildAvatarUrl ? `\n🔗 [Guild Avatar URL](${guildAvatarUrl})` : "")
      )
      // Display guild avatar if it exists, otherwise fall back to global avatar
      .setImage(guildAvatarUrl || globalAvatarUrl)
      .setFooter({ text: guildAvatarUrl ? "Showing guild-specific avatar" : "Showing global account avatar" })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
