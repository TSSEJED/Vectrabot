/**
 * @file addons/utility/audit-logs.js
 * @description Advanced server event logging module.
 * Listens for guild events and broadcasts them to the configured audit log channel.
 *
 * © 2026 Cortex HQ & bot-hosting.net
 */

const { EmbedBuilder, AuditLogEvent } = require("discord.js");
const Emojis = require("../../config/emojis");

module.exports = {
  name: "AuditLogs",

  /**
   * Initialize audit log listeners.
   * @param {import('discord.js').Client} client
   */
  init(client) {
    // 1. Message Deletion
    client.on("messageDelete", async (message) => {
      if (!message.guild || message.author?.bot) return;

      const embed = new EmbedBuilder()
        .setColor(0xef4444) // Red
        .setTitle(`${Emojis.resolve(client, "error", message.guildId)} Message Deleted`)
        .setDescription(`**Author:** ${message.author.tag} (\`${message.author.id}\`)\n**Channel:** ${message.channel.toString()}`)
        .addFields({ name: "Content", value: message.content?.slice(0, 1024) || "*No content (possibly an embed or attachment)*" })
        .setTimestamp();

      await client.logger._broadcastToDiscord("AUDIT", "", 0xef4444, "", message.guildId, embed);
    });

    // 2. Message Update
    client.on("messageUpdate", async (oldMessage, newMessage) => {
      if (!newMessage.guild || newMessage.author?.bot) return;
      if (oldMessage.content === newMessage.content) return;

      const embed = new EmbedBuilder()
        .setColor(0x3b82f6) // Blue
        .setTitle(`${Emojis.resolve(client, "info", newMessage.guildId)} Message Edited`)
        .setDescription(`**Author:** ${newMessage.author.tag} (\`${newMessage.author.id}\`)\n**Channel:** ${newMessage.channel.toString()}\n[Jump to Message](${newMessage.url})`)
        .addFields(
          { name: "Before", value: oldMessage.content?.slice(0, 1024) || "*No content*" },
          { name: "After", value: newMessage.content?.slice(0, 1024) || "*No content*" }
        )
        .setTimestamp();

      await client.logger._broadcastToDiscord("AUDIT", "", 0x3b82f6, "", newMessage.guildId, embed);
    });

    // 3. Member Join
    client.on("guildMemberAdd", async (member) => {
      const embed = new EmbedBuilder()
        .setColor(0x10b981) // Green
        .setTitle(`${Emojis.resolve(client, "success", member.guild.id)} Member Joined`)
        .setThumbnail(member.user.displayAvatarURL())
        .setDescription(`**User:** ${member.user.tag} (\`${member.user.id}\`)\n**Created:** <t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`)
        .setTimestamp();

      await client.logger._broadcastToDiscord("AUDIT", "", 0x10b981, "", member.guild.id, embed);
    });

    // 4. Member Leave
    client.on("guildMemberRemove", async (member) => {
      const embed = new EmbedBuilder()
        .setColor(0xf59e0b) // Amber
        .setTitle(`${Emojis.resolve(client, "support", member.guild.id)} Member Left`)
        .setThumbnail(member.user.displayAvatarURL())
        .setDescription(`**User:** ${member.user.tag} (\`${member.user.id}\`)\n**Joined:** ${member.joinedTimestamp ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : "Unknown"}`)
        .setTimestamp();

      await client.logger._broadcastToDiscord("AUDIT", "", 0xf59e0b, "", member.guild.id, embed);
    });

    // 5. Channel Creation
    client.on("channelCreate", async (channel) => {
      if (!channel.guild) return;
      const embed = new EmbedBuilder()
        .setColor(0x10b981)
        .setTitle(`${Emojis.resolve(client, "success", channel.guild.id)} Channel Created`)
        .setDescription(`**Name:** ${channel.name}\n**Type:** \`${channel.type}\`\n**ID:** \`${channel.id}\``)
        .setTimestamp();

      await client.logger._broadcastToDiscord("AUDIT", "", 0x10b981, "", channel.guild.id, embed);
    });

    // 6. Channel Deletion
    client.on("channelDelete", async (channel) => {
      if (!channel.guild) return;
      const embed = new EmbedBuilder()
        .setColor(0xef4444)
        .setTitle(`${Emojis.resolve(client, "error", channel.guild.id)} Channel Deleted`)
        .setDescription(`**Name:** ${channel.name}\n**Type:** \`${channel.type}\`\n**ID:** \`${channel.id}\``)
        .setTimestamp();

      await client.logger._broadcastToDiscord("AUDIT", "", 0xef4444, "", channel.guild.id, embed);
    });

    // 7. Role Creation
    client.on("roleCreate", async (role) => {
      const embed = new EmbedBuilder()
        .setColor(0x10b981)
        .setTitle(`${Emojis.resolve(client, "success", role.guild.id)} Role Created`)
        .setDescription(`**Name:** ${role.name}\n**ID:** \`${role.id}\``)
        .setTimestamp();

      await client.logger._broadcastToDiscord("AUDIT", "", 0x10b981, "", role.guild.id, embed);
    });

    // 8. Role Deletion
    client.on("roleDelete", async (role) => {
      const embed = new EmbedBuilder()
        .setColor(0xef4444)
        .setTitle(`${Emojis.resolve(client, "error", role.guild.id)} Role Deleted`)
        .setDescription(`**Name:** ${role.name}\n**ID:** \`${role.id}\``)
        .setTimestamp();

      await client.logger._broadcastToDiscord("AUDIT", "", 0xef4444, "", role.guild.id, embed);
    });
  }
};
