/**
 * @file addons/utility/welcome-system.js
 * @description Advanced welcoming and goodbye automation module.
 * Supports customizable messages, channel broadcasts, and private DM welcomes.
 *
 * © 2026 Cortex HQ & bot-hosting.net
 */

const { EmbedBuilder } = require("discord.js");
const Emojis = require("../../config/emojis");
const storage = require("../../utils/storage");

module.exports = {
  name: "WelcomeSystem",

  /**
   * Initialize welcome and goodbye listeners.
   * @param {import('discord.js').Client} client
   */
  init(client) {
    // 1. Member Join (Welcome)
    client.on("guildMemberAdd", async (member) => {
      const config = storage.get("welcome", member.guild.id);
      if (!config || !config.enabled) return;

      const welcomeMessage = this.formatMessage(config.welcomeMessage || "Welcome {user} to **{server}**! You are our {memberCount}th member.", member);

      // Channel Broadcast
      if (config.channelId) {
        const channel = await member.guild.channels.fetch(config.channelId).catch(() => null);
        if (channel && channel.isTextBased()) {
          const embed = new EmbedBuilder()
            .setColor(0x10b981)
            .setTitle(`${Emojis.resolve(client, "success", member.guild.id)} New Arrival!`)
            .setThumbnail(member.user.displayAvatarURL())
            .setDescription(welcomeMessage)
            .setFooter({ text: `Member Count: ${member.guild.memberCount}` })
            .setTimestamp();

          await channel.send({ embeds: [embed] }).catch(() => null);
        }
      }

      // DM Welcome
      if (config.dmEnabled) {
        await member.send({
          content: welcomeMessage
        }).catch(() => null);
      }
    });

    // 2. Member Leave (Goodbye)
    client.on("guildMemberRemove", async (member) => {
      const config = storage.get("welcome", member.guild.id);
      if (!config || !config.goodbyeEnabled) return;

      const goodbyeMessage = this.formatMessage(config.goodbyeMessage || "**{username}** just left the server. We now have {memberCount} members.", member);

      if (config.goodbyeChannelId || config.channelId) {
        const channelId = config.goodbyeChannelId || config.channelId;
        const channel = await member.guild.channels.fetch(channelId).catch(() => null);
        if (channel && channel.isTextBased()) {
          const embed = new EmbedBuilder()
            .setColor(0xef4444)
            .setTitle(`${Emojis.resolve(client, "error", member.guild.id)} Farewell`)
            .setThumbnail(member.user.displayAvatarURL())
            .setDescription(goodbyeMessage)
            .setFooter({ text: `Member Count: ${member.guild.memberCount}` })
            .setTimestamp();

          await channel.send({ embeds: [embed] }).catch(() => null);
        }
      }
    });
  },

  /**
   * Replace placeholders in a message string.
   * @param {string} text
   * @param {import('discord.js').GuildMember} member
   * @returns {string}
   */
  formatMessage(text, member) {
    return text
      .replace(/{user}/g, member.toString())
      .replace(/{username}/g, member.user.username)
      .replace(/{member_tag}/g, member.user.tag)
      .replace(/{server}/g, member.guild.name)
      .replace(/{memberCount}/g, member.guild.memberCount.toString());
  }
};
