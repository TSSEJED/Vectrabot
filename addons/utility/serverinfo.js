/**
 * @file addons/serverinfo.js
 * @description Advanced slash command to fetch comprehensive server metadata and demographics.
 * 
 * © 2026 Cortex HQ & bot-hosting.net
 */

const { SlashCommandBuilder, EmbedBuilder, ChannelType, MessageFlags } = require("discord.js");
const Emojis = require("../../config/emojis");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("serverinfo")
    .setDescription("Returns server metadata and cached stats."),

  /**
   * Execute the serverinfo command.
   * @param {import('discord.js').ChatInputCommandInteraction} interaction 
   * @param {import('discord.js').Client} client 
   */
  async execute(interaction, client) {
    const guild = interaction.guild;
    if (!guild) {
      return interaction.reply({
        content: `${Emojis.global.error} This command can only be executed within a server.`,
        flags: MessageFlags.Ephemeral
      });
    }

    await interaction.deferReply();

    // 1. Fetch exact members breakdown
    let totalMembers = guild.memberCount;
    let botsCount = 0;
    let humansCount = totalMembers;

    try {
      const allMembers = await guild.members.fetch();
      botsCount = allMembers.filter(m => m.user.bot).size;
      humansCount = allMembers.size - botsCount;
      totalMembers = allMembers.size;
    } catch (err) {
      client.logger.warn("Failed to fetch full guild members list in serverinfo. Falling back to cache.", { error: err.message });
      botsCount = guild.members.cache.filter(m => m.user.bot).size;
      humansCount = totalMembers - botsCount;
    }

    // 2. Fetch channels breakdown
    const channels = guild.channels.cache;
    const textCount = channels.filter(c => c.type === ChannelType.GuildText).size;
    const voiceCount = channels.filter(c => c.type === ChannelType.GuildVoice).size;
    const categoryCount = channels.filter(c => c.type === ChannelType.GuildCategory).size;
    const activeThreads = channels.filter(c => c.type === ChannelType.PublicThread || c.type === ChannelType.PrivateThread).size;

    // 3. Asset metrics
    const emojiCount = guild.emojis.cache.size;
    const roleCount = guild.roles.cache.size;

    // 4. Boost parameters
    const boostCount = guild.premiumSubscriptionCount || 0;
    const boostTier = guild.premiumTier;

    // 5. Verification level mappings
    const verificationMap = {
      0: "NONE (Unrestricted)",
      1: "LOW (Verified Email)",
      2: "MEDIUM (Registered for >5 mins)",
      3: "HIGH (Member for >10 mins)",
      4: "VERY_HIGH (Verified Phone)"
    };
    const verificationLevel = verificationMap[guild.verificationLevel] || guild.verificationLevel;

    const embed = new EmbedBuilder()
      .setColor(0x3b82f6)
      .setTitle(`${Emojis.global.web} Guild Diagnostics — ${guild.name}`)
      .setThumbnail(guild.iconURL({ size: 256 }))
      .addFields(
        { name: "👑 Server Ownership", value: `• **Owner ID:** \`${guild.ownerId}\`\n• **Verification:** \`${verificationLevel}\`\n• **Region/Locale:** \`${guild.preferredLocale}\``, inline: true },
        { name: "👥 Server Demographics", value: `• **Total Members:** ${totalMembers}\n• **Humans:** ${humansCount}\n• **Bots:** ${botsCount}`, inline: true },
        { name: "🎛️ Dynamic Assets", value: `• **Custom Emojis:** ${emojiCount}\n• **Total Roles:** ${roleCount}\n• **Boosts:** ${boostCount} (Tier ${boostTier})`, inline: true },
        { name: "📂 Channels Distribution", value: `• **Text Channels:** ${textCount}\n• **Voice Channels:** ${voiceCount}\n• **Categories:** ${categoryCount}\n• **Active Threads:** ${activeThreads}`, inline: false }
      )
      .setFooter({ text: `Created <t:${Math.floor(guild.createdTimestamp / 1000)}:R>` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }
};
