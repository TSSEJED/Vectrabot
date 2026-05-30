/**
 * @file addons/utility/server-stats.js
 * @description Advanced server statistics system.
 * Updates voice/text channel names to reflect real-time member and guild counts.
 *
 * © 2026 Cortex HQ & bot-hosting.net
 */

const storage = require("../../utils/storage");

module.exports = {
  name: "ServerStats",

  /**
   * Initialize the stats system.
   * @param {import('discord.js').Client} client
   */
  init(client) {
    // 1. Listen for join/leave events for immediate updates (debounced by Discord rate limits)
    client.on("guildMemberAdd", (member) => this.updateStats(client, member.guild.id));
    client.on("guildMemberRemove", (member) => this.updateStats(client, member.guild.id));

    // 2. Periodic refresh every 10 minutes to ensure accuracy
    setInterval(() => {
      const allStats = storage.getAll("server_stats");
      for (const guildId of Object.keys(allStats)) {
        this.updateStats(client, guildId);
      }
    }, 10 * 60 * 1000);
  },

  /**
   * Update the stats channels for a guild.
   * @param {import('discord.js').Client} client
   * @param {string} guildId
   */
  async updateStats(client, guildId) {
    const config = storage.get("server_stats", guildId);
    if (!config || !config.enabled) return;

    const guild = await client.guilds.fetch(guildId).catch(() => null);
    if (!guild) return;

    // Fetch members to get accurate counts (bot vs human)
    const members = await guild.members.fetch().catch(() => guild.members.cache);
    const total = members.size;
    const bots = members.filter(m => m.user.bot).size;
    const humans = total - bots;
    const roles = guild.roles.cache.size;

    const stats = {
      total: `📊 Total Members: ${total}`,
      humans: `👥 Humans: ${humans}`,
      bots: `🤖 Bots: ${bots}`,
      roles: `🔐 Roles: ${roles}`
    };

    for (const [key, channelId] of Object.entries(config.channels || {})) {
      if (!channelId) continue;

      const channel = await guild.channels.fetch(channelId).catch(() => null);
      if (channel && stats[key]) {
        // Discord rate limit for channel name updates is 2 times per 10 minutes per channel.
        // We rely on the name check and periodic refresh to stay within limits.
        if (channel.name !== stats[key]) {
          await channel.setName(stats[key]).catch(err => {
            if (err.code !== 50035) { // Skip "Invalid Form Body" (usually rate limit or length)
              client.logger.warn(`Failed to update stat channel ${channelId} in ${guildId}:`, { error: err.message });
            }
          });
        }
      }
    }
  }
};
