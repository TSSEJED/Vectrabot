/**
 * @file addons/banner.js
 * @description Slash command to fetch a user's custom profile banner or the server's banner image.
 * Force-fetches the user REST payload to hydrate banner field (not cached by default).
 * 
 * © 2026 Cortex HQ & bot-hosting.net
 */

const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require("discord.js");
const Emojis = require("../../config/emojis");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("banner")
    .setDescription("Fetches a user's or server's custom banner image.")
    .addSubcommand(sub =>
      sub.setName("user")
        .setDescription("Fetches a user's custom profile banner.")
        .addUserOption(option =>
          option.setName("target")
            .setDescription("The user whose banner to fetch. Defaults to yourself.")
            .setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub.setName("server")
        .setDescription("Fetches the current server's banner image.")
    ),

  /**
   * Execute the banner command.
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   * @param {import('discord.js').Client} client
   */
  async execute(interaction, client) {
    const sub = interaction.options.getSubcommand();

    if (sub === "user") {
      const targetUser = interaction.options.getUser("target") || interaction.user;

      // Banner data is NOT included in standard cached user objects.
      // We must force-fetch via REST to hydrate the banner hash field.
      const fetchedUser = await client.users.fetch(targetUser.id, { force: true }).catch(() => null);

      if (!fetchedUser) {
        return interaction.reply({
          content: `${Emojis.resolve(client, "error", interaction.guildId)} Unable to resolve user data. Please try again.`,
          flags: MessageFlags.Ephemeral
        });
      }

      // Resolve banner URL — returns null if the user has no banner set
      const bannerUrl = fetchedUser.bannerURL({ size: 1024 });

      if (!bannerUrl) {
        return interaction.reply({
          content: `${Emojis.resolve(client, "info", interaction.guildId)} **${fetchedUser.username}** does not have a custom profile banner set.`,
          flags: MessageFlags.Ephemeral
        });
      }

      const embed = new EmbedBuilder()
        .setColor(fetchedUser.accentColor || 0x3b82f6)
        .setTitle(`${Emojis.resolve(client, "web", interaction.guildId)} User Banner — ${fetchedUser.username}`)
        .setDescription(`🔗 [Open Banner URL](${bannerUrl})`)
        .setImage(bannerUrl)
        .setFooter({ text: `${process.env.BOT_NAME || "Bot"} • User Banner Fetch` })
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }

    if (sub === "server") {
      const guild = interaction.guild;
      if (!guild) {
        return interaction.reply({
          content: `${Emojis.resolve(client, "error", interaction.guildId)} This subcommand can only be executed within a server.`,
          flags: MessageFlags.Ephemeral
        });
      }

      const bannerUrl = guild.bannerURL({ size: 1024 });

      if (!bannerUrl) {
        return interaction.reply({
          content: `${Emojis.resolve(client, "info", interaction.guildId)} **${guild.name}** does not have a server banner set. Banners require Boost Tier 2 or above.`,
          flags: MessageFlags.Ephemeral
        });
      }

      const embed = new EmbedBuilder()
        .setColor(0x3b82f6)
        .setTitle(`${Emojis.resolve(client, "web", interaction.guildId)} Server Banner — ${guild.name}`)
        .setDescription(`🔗 [Open Banner URL](${bannerUrl})`)
        .setImage(bannerUrl)
        .setFooter({ text: `${process.env.BOT_NAME || "Bot"} • Server Banner Fetch` })
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }
  }
};
