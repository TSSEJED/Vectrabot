/**
 * @file addons/channelinfo.js
 * @description Slash command to inspect channel metadata, slowmode, overwrites, and type.
 * 
 * © 2026 Cortex HQ & bot-hosting.net
 */

const { SlashCommandBuilder, EmbedBuilder, ChannelType, MessageFlags } = require("discord.js");
const Emojis = require("../config/emojis");

// Map ChannelType integers to human-readable labels
const CHANNEL_TYPE_LABELS = {
  [ChannelType.GuildText]:           "Text Channel",
  [ChannelType.GuildVoice]:          "Voice Channel",
  [ChannelType.GuildCategory]:       "Category",
  [ChannelType.GuildAnnouncement]:   "Announcement Channel",
  [ChannelType.GuildStageVoice]:     "Stage Channel",
  [ChannelType.GuildForum]:          "Forum Channel",
  [ChannelType.GuildMedia]:          "Media Channel",
  [ChannelType.PublicThread]:        "Public Thread",
  [ChannelType.PrivateThread]:       "Private Thread",
  [ChannelType.AnnouncementThread]:  "Announcement Thread"
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("channelinfo")
    .setDescription("Displays detailed metadata about a channel.")
    .addChannelOption(option =>
      option.setName("channel")
        .setDescription("The channel to inspect. Defaults to the current channel.")
        .setRequired(false)
    ),

  /**
   * Execute the channelinfo command.
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   * @param {import('discord.js').Client} client
   */
  async execute(interaction, client) {
    const channel = interaction.options.getChannel("channel") || interaction.channel;

    if (!channel) {
      return interaction.reply({
        content: `${Emojis.global.error} Could not resolve the target channel.`,
        flags: MessageFlags.Ephemeral
      });
    }

    // Resolve channel type label
    const typeLabel = CHANNEL_TYPE_LABELS[channel.type] || `Unknown (type ${channel.type})`;

    // Resolve parent category name
    const categoryName = channel.parent ? `\`${channel.parent.name}\`` : "`None`";

    // Slowmode (in seconds, convert to human-readable)
    const slowmode = channel.rateLimitPerUser ?? 0;
    const slowmodeText = slowmode > 0 ? `\`${slowmode}s\`` : "`Off`";

    // Topic — only available on text/announcement channels
    const topic = channel.topic ? `\`\`\`${channel.topic.slice(0, 200)}\`\`\`` : "`No topic set`";

    // Permission overwrites count (roles + users with explicit overrides)
    const overwriteCount = channel.permissionOverwrites ? channel.permissionOverwrites.cache.size : 0;

    // Voice-specific attributes
    const isVoice = channel.type === ChannelType.GuildVoice || channel.type === ChannelType.GuildStageVoice;
    const voiceDetails = isVoice
      ? `• **Bitrate:** \`${(channel.bitrate / 1000).toFixed(0)}kbps\`\n• **User Limit:** \`${channel.userLimit || "Unlimited"}\``
      : null;

    const embed = new EmbedBuilder()
      .setColor(0x3b82f6)
      .setTitle(`${Emojis.global.web} Channel Diagnostics — #${channel.name}`)
      .addFields(
        {
          name: "🆔 Identity",
          value: `• **ID:** \`${channel.id}\`\n• **Type:** \`${typeLabel}\`\n• **Category:** ${categoryName}`,
          inline: true
        },
        {
          name: "⚙️ Configuration",
          value: `• **Slowmode:** ${slowmodeText}\n• **NSFW:** \`${channel.nsfw ? "Yes" : "No"}\`\n• **Permission Overwrites:** \`${overwriteCount}\``,
          inline: true
        },
        ...(voiceDetails ? [{ name: "🔊 Voice Settings", value: voiceDetails, inline: true }] : []),
        {
          name: "📝 Topic",
          value: topic,
          inline: false
        }
      )
      .setFooter({ text: `Created <t:${Math.floor(channel.createdTimestamp / 1000)}:R>` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
