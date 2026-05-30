/**
 * @file addons/utility/join-to-create.js
 * @description Advanced voice automation module.
 * Dynamically creates temporary voice channels when a user joins a trigger channel.
 *
 * © 2026 Cortex HQ & bot-hosting.net
 */

const { ChannelType, PermissionFlagsBits } = require("discord.js");
const storage = require("../../utils/storage");

module.exports = {
  name: "JoinToCreate",

  /**
   * Initialize voice state listeners.
   * @param {import('discord.js').Client} client
   */
  init(client) {
    client.on("voiceStateUpdate", async (oldState, newState) => {
      const guildId = newState.guild.id;
      const config = storage.get("jtc", guildId);
      if (!config || !config.channelId) return;

      const activeChannels = storage.get("jtc_active", guildId) || {};

      // 1. User joins the trigger channel
      if (newState.channelId === config.channelId) {
        try {
          const parentCategory = config.categoryId || newState.channel.parentId;

          const tempChannel = await newState.guild.channels.create({
            name: `🔊 ${newState.member.user.username}'s Room`,
            type: ChannelType.GuildVoice,
            parent: parentCategory,
            permissionOverwrites: [
              {
                id: newState.member.id,
                allow: [PermissionFlagsBits.ManageChannels, PermissionFlagsBits.MoveMembers, PermissionFlagsBits.MuteMembers, PermissionFlagsBits.DeafenMembers]
              }
            ]
          });

          // Move the member to the new channel
          await newState.setChannel(tempChannel);

          // Log the active channel
          activeChannels[tempChannel.id] = newState.member.id;
          storage.set("jtc_active", guildId, activeChannels);

          client.logger.info(`Created temporary voice channel ${tempChannel.name} for ${newState.member.user.tag}`);
        } catch (err) {
          client.logger.error("Failed to create temporary JTC channel:", { error: err.message });
        }
      }

      // 2. User leaves a temporary channel
      if (oldState.channelId && activeChannels[oldState.channelId]) {
        const oldChannel = oldState.channel;
        if (oldChannel && oldChannel.members.size === 0) {
          try {
            await oldChannel.delete();
            delete activeChannels[oldState.channelId];
            storage.set("jtc_active", guildId, activeChannels);
            client.logger.info(`Deleted empty temporary JTC channel: ${oldChannel.name}`);
          } catch (err) {
            // Channel might already be deleted
            delete activeChannels[oldState.channelId];
            storage.set("jtc_active", guildId, activeChannels);
          }
        }
      }
    });
  }
};
