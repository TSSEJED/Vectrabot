/**
 * @file addons/roleinfo.js
 * @description Slash command to inspect a role's metadata, permissions, and member count.
 * 
 * © 2026 Cortex HQ & bot-hosting.net
 */

const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, MessageFlags } = require("discord.js");
const Emojis = require("../../config/emojis");

// Key permissions to surface in the output (most relevant for moderation/security audits)
const KEY_PERMISSIONS = [
  "Administrator",
  "ManageGuild",
  "ManageRoles",
  "ManageChannels",
  "ManageMessages",
  "ManageNicknames",
  "ManageWebhooks",
  "KickMembers",
  "BanMembers",
  "MentionEveryone",
  "ModerateMembers",
  "ViewAuditLog",
  "MoveMembers",
  "DeafenMembers",
  "MuteMembers"
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName("roleinfo")
    .setDescription("Displays detailed metadata about a specific server role.")
    .addRoleOption(option =>
      option.setName("role")
        .setDescription("The role to inspect.")
        .setRequired(true)
    ),

  /**
   * Execute the roleinfo command.
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

    const role = interaction.options.getRole("role");

    // Count members with this role — roles cache is populated, no fetch needed
    const memberCount = guild.members.cache.filter(m => m.roles.cache.has(role.id)).size;

    // Format hex color or fallback to "No Color"
    const hexColor = role.hexColor !== "#000000" ? role.hexColor : "No Color";

    // Resolve which key permissions are granted on this role's bitfield
    const rolePerms = new PermissionsBitField(role.permissions.bitfield);
    const activePerms = KEY_PERMISSIONS.filter(perm => rolePerms.has(PermissionsBitField.Flags[perm]));
    const permDisplay = activePerms.length > 0
      ? activePerms.map(p => `\`${p}\``).join(", ")
      : "`No Notable Permissions`";

    const embed = new EmbedBuilder()
      .setColor(role.color || 0x3b82f6)
      .setTitle(`${Emojis.resolve(client, "satellite", interaction.guildId)} Role Diagnostics — ${role.name}`)
      .addFields(
        {
          name: "🆔 Identity",
          value: `• **ID:** \`${role.id}\`\n• **Color:** \`${hexColor}\`\n• **Position:** \`#${role.position}\` of \`${guild.roles.cache.size}\``,
          inline: true
        },
        {
          name: "⚙️ Attributes",
          value: `• **Mentionable:** \`${role.mentionable ? "Yes" : "No"}\`\n• **Hoisted:** \`${role.hoist ? "Yes" : "No"}\`\n• **Managed:** \`${role.managed ? "Yes (Bot/Integration)" : "No"}\``,
          inline: true
        },
        {
          name: "👥 Members",
          value: `\`${memberCount}\` member${memberCount !== 1 ? "s" : ""} hold this role`,
          inline: true
        },
        {
          name: "🔑 Notable Permissions",
          value: permDisplay,
          inline: false
        }
      )
      .setFooter({ text: `Created <t:${Math.floor(role.createdTimestamp / 1000)}:R>` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
