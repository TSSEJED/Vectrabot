/**
 * @file addons/userinfo.js
 * @description Advanced slash command to fetch user profiles, badges, statuses, and guild attributes.
 * 
 * © 2026 Cortex HQ & bot-hosting.net
 */

const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require("discord.js");
const Emojis = require("../../config/emojis");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("userinfo")
    .setDescription("Returns comprehensive user profile data.")
    .addUserOption(option => 
      option.setName("target")
        .setDescription("Select the target user to audit.")
        .setRequired(false)
    ),

  /**
   * Execute the userinfo command.
   * @param {import('discord.js').ChatInputCommandInteraction} interaction 
   * @param {import('discord.js').Client} client 
   */
  async execute(interaction, client) {
    const guild = interaction.guild;
    if (!guild) {
      return interaction.reply({
        content: `${Emojis.resolve(client, "error", interaction.guildId)} This command can only be executed within a server.`,
        flags: MessageFlags.Ephemeral
      });
    }

    await interaction.deferReply();

    const targetUser = interaction.options.getUser("target") || interaction.user;
    
    // Fetch member to ensure dynamic attributes like roles and join dates are populated
    let member;
    try {
      member = await guild.members.fetch(targetUser.id);
    } catch {
      // Fallback if user is not in the guild anymore
      member = null;
    }

    // 1. Resolve User Badges (Flags)
    const userFlags = targetUser.flags ? targetUser.flags.toArray() : [];
    const formattedBadges = userFlags.length > 0 
      ? userFlags.map(flag => `\`${flag.replace(/_/g, " ")}\``).join(", ") 
      : "None";

    // 2. Resolve Server Join Position
    let joinPosition = "N/A";
    if (member) {
      try {
        const guildMembers = await guild.members.fetch();
        const sorted = [...guildMembers.values()]
          .filter(m => m.joinedTimestamp)
          .sort((a, b) => a.joinedTimestamp - b.joinedTimestamp);
        const index = sorted.findIndex(m => m.id === targetUser.id);
        if (index !== -1) {
          joinPosition = `#${index + 1} / ${sorted.length}`;
        }
      } catch (err) {
        client.logger.warn("Failed to fetch guild members list for join position calculation:", { error: err.message });
      }
    }

    // 3. Resolve Presence Status
    let statusText = "Offline / Invisible (No Presence Intent)";
    if (member && member.presence) {
      const statusMap = {
        online: "🟢 Online",
        idle: "🌙 Idle",
        dnd: "🔴 Do Not Disturb",
        offline: "⚫ Offline"
      };
      statusText = statusMap[member.presence.status] || member.presence.status;
    }

    // 4. Resolve Roles
    const rolesList = member 
      ? member.roles.cache.filter(role => role.id !== guild.id).map(role => role.toString()).join(", ") || "None"
      : "N/A";

    const embed = new EmbedBuilder()
      .setColor(member ? member.displayColor || 0x3b82f6 : 0x3b82f6)
      .setTitle(`${Emojis.resolve(client, "support", interaction.guildId)} User Diagnostics — ${targetUser.username}`)
      .setThumbnail(targetUser.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: "👤 Identity Details", value: `• **Username:** ${targetUser.tag}\n• **ID:** \`${targetUser.id}\`\n• **Bot?** \`${targetUser.bot ? "Yes" : "No"}\``, inline: true },
        { name: "🛡️ Badges & Status", value: `• **Status:** ${statusText}\n• **Badges:** ${formattedBadges}`, inline: true },
        { name: "📅 Chronological Milestones", value: `• **Registered:** <t:${Math.floor(targetUser.createdTimestamp / 1000)}:R>\n• **Server Joined:** ${member ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : "`Not in Server`"}\n• **Join Position:** \`${joinPosition}\``, inline: false },
        { name: "🏷️ Server Roles", value: rolesList, inline: false }
      )
      .setFooter({ text: `${process.env.BOT_NAME || "Bot"} Audit Log` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }
};
