/**
 * @file addons/inviteinfo.js
 * @description Slash command to resolve an active invite code and surface its metadata.
 * Displays the inviter, destination channel, use count, temporary membership flag, and expiry.
 * 
 * © 2026 Cortex HQ & bot-hosting.net
 */

const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require("discord.js");
const Emojis = require("../../config/emojis");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("inviteinfo")
    .setDescription("Parses an active invite code and returns its full metadata.")
    .addStringOption(option =>
      option.setName("code")
        .setDescription("The invite code or full discord.gg URL to inspect.")
        .setRequired(true)
    ),

  /**
   * Execute the inviteinfo command.
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   * @param {import('discord.js').Client} client
   */
  async execute(interaction, client) {
    await interaction.deferReply();

    // Strip full URL down to raw invite code (e.g. "https://discord.gg/abc123" → "abc123")
    const raw = interaction.options.getString("code");
    const code = raw.replace(/^(https?:\/\/)?(www\.)?(discord\.gg|discord\.com\/invite)\//i, "").trim();

    // Fetch invite via Discord REST — requires the MANAGE_GUILD permission for full metadata
    let invite;
    try {
      invite = await client.fetchInvite(code);
    } catch (err) {
      return interaction.editReply({
        content: `${Emojis.global.error} Could not resolve invite code \`${code}\`. It may be invalid or expired.`
      });
    }

    // 1. Inviter details
    const inviter = invite.inviter
      ? `${invite.inviter.tag} (\`${invite.inviter.id}\`)`
      : "`Unknown / Vanity URL`";

    // 2. Destination channel
    const channel = invite.channel
      ? `#${invite.channel.name} (\`${invite.channel.id}\`)`
      : "`Unknown Channel`";

    // 3. Use count and cap
    const usesText = invite.maxUses
      ? `\`${invite.uses}\` / \`${invite.maxUses}\``
      : `\`${invite.uses}\` / \`Unlimited\``;

    // 4. Expiry — maxAge === 0 means the invite never expires
    const expiryText = invite.maxAge === 0 || !invite.maxAge
      ? "`Never Expires`"
      : `<t:${Math.floor((invite.createdTimestamp + invite.maxAge * 1000) / 1000)}:R>`;

    // 5. Guild info from invite — may differ from current guild (cross-server invites)
    const guildName = invite.guild ? invite.guild.name : "`Not a Guild Invite`";
    const guildId   = invite.guild ? `\`${invite.guild.id}\`` : "`N/A`";

    const embed = new EmbedBuilder()
      .setColor(0x3b82f6)
      .setTitle(`${Emojis.global.web} Invite Diagnostics — \`${code}\``)
      .addFields(
        {
          name: "📌 Destination",
          value: `• **Server:** ${guildName} (${guildId})\n• **Channel:** ${channel}`,
          inline: false
        },
        {
          name: "👤 Inviter",
          value: inviter,
          inline: true
        },
        {
          name: "📊 Usage",
          value: usesText,
          inline: true
        },
        {
          name: "⚙️ Settings",
          value: `• **Temporary Membership:** \`${invite.temporary ? "Yes" : "No"}\`\n• **Expires:** ${expiryText}`,
          inline: false
        }
      )
      .setFooter({ text: `${process.env.BOT_NAME || "Bot"} • Invite Resolver` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }
};
