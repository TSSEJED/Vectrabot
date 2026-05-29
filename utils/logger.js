/**
 * @file utils/logger.js
 * @description Centralized event-driven Logger class instantiated onto client.logger.
 * Supports console formatting and real-time Discord channel broadcasting using
 * Discord Embeds for channel messages.
 * 
 * NOTE ON COMPONENTS V2: Container (type 25) and TextDisplay (type 24) are ONLY valid
 * inside interaction replies (interaction.reply / interaction.followUp). They are NOT
 * accepted by the channel.send() REST endpoint, which only allows component types:
 * 1, 9, 10, 12, 13, 14, 17. This is why we use EmbedBuilder here for full compatibility.
 * 
 * © 2026 Cortex HQ & bot-hosting.net
 */

const { EmbedBuilder } = require("discord.js");
const emojis = require("../config/emojis");
const storage = require("./storage");

class Logger {
  /**
   * Instantiate the Logger and bind it to the Discord Client.
   * @param {import('discord.js').Client} client - The active Discord client instance.
   */
  constructor(client) {
    this.client = client;
    this.prefix = "[Cortex HQ Partnership]";
  }

  /**
   * Log info events to console and broadcast to Discord log channel if configured.
   * @param {string} message - The message body to record.
   * @param {object} [metadata] - Optional additional debug variables or metadata.
   */
  async info(message, metadata = {}) {
    const timestamp = new Date().toISOString();
    console.log(`\x1b[32m${this.prefix}\x1b[0m [INFO] [${timestamp}] ${message}`, Object.keys(metadata).length ? metadata : "");

    // 0x3b82f6 = Cortex Blue — used for informational event embeds
    await this._broadcastToDiscord("INFO", message, 0x3b82f6, emojis.global.info);
  }

  /**
   * Log warning events to console and broadcast to Discord log channel if configured.
   * @param {string} message - The message body to record.
   * @param {object} [metadata] - Optional additional debug variables or metadata.
   */
  async warn(message, metadata = {}) {
    const timestamp = new Date().toISOString();
    console.warn(`\x1b[33m${this.prefix}\x1b[0m [WARN] [${timestamp}] ${message}`, Object.keys(metadata).length ? metadata : "");

    // 0xf59e0b = Cortex Amber — used for warning level event embeds
    await this._broadcastToDiscord("WARN", message, 0xf59e0b, emojis.global.support);
  }

  /**
   * Log error events to console and broadcast to Discord log channel if configured.
   * @param {string} message - The message body to record.
   * @param {object} [metadata] - Optional additional debug variables or metadata.
   */
  async error(message, metadata = {}) {
    const timestamp = new Date().toISOString();
    console.error(`\x1b[31m${this.prefix}\x1b[0m [ERROR] [${timestamp}] ${message}`, Object.keys(metadata).length ? metadata : "");

    // 0xef4444 = Cortex Red — used for error/critical event embeds
    await this._broadcastToDiscord("ERROR", message, 0xef4444, emojis.global.error);
  }

  /**
   * Log command executions to console and broadcast to dynamic log channel if configured.
   * @param {string} message - The message body to record.
   * @param {object} [metadata] - Optional additional debug variables or metadata.
   */
  async command(message, metadata = {}) {
    const timestamp = new Date().toISOString();
    console.log(`\x1b[36m${this.prefix}\x1b[0m [COMMAND] [${timestamp}] ${message}`, Object.keys(metadata).length ? metadata : "");

    // 0x06b6d4 = Cortex Cyan — used for command log event embeds
    await this._broadcastToDiscord("COMMAND", message, 0x06b6d4, emojis.global.satellite);
  }

  /**
   * Broadcasts a log event to the configured Discord channel using a standard EmbedBuilder.
   * Supports both global environment config and guild-specific persistent config.
   * @private
   * @param {string} level - Log level label ('INFO', 'WARN', 'ERROR', 'COMMAND').
   * @param {string} message - Message content to broadcast.
   * @param {number} color - Embed left-border accent color as a hex integer.
   * @param {string} emoji - Unicode fallback emoji prefix for the embed title.
   * @param {string} [guildId] - Optional guild ID for guild-specific logging.
   */
  async _broadcastToDiscord(level, message, color, emoji, guildId) {
    let channelId = null;

    if (guildId) {
      // Try guild-specific persistent storage first
      const guildLogs = storage.get("logs", guildId) || {};
      channelId = guildLogs[level.toLowerCase()] || guildLogs.general;
    }

    // Fall back to environment variables if no guild-specific channel is set
    if (!channelId) {
      if (level === "INFO") {
        channelId = process.env.INFO_LOG_CHANNEL_ID || process.env.LOG_CHANNEL_ID;
      } else if (level === "WARN") {
        channelId = process.env.WARN_LOG_CHANNEL_ID || process.env.LOG_CHANNEL_ID;
      } else if (level === "ERROR") {
        channelId = process.env.ERROR_LOG_CHANNEL_ID || process.env.LOG_CHANNEL_ID;
      } else if (level === "COMMAND") {
        channelId = process.env.COMMAND_LOG_CHANNEL_ID || process.env.LOG_CHANNEL_ID;
      }
    }

    // No channel configured? No Discord broadcast log!
    if (!channelId) return;

    try {
      const channel = await this.client.channels.fetch(channelId).catch(() => null);
      if (!channel || !channel.isTextBased()) return;

      // Build a color-coded embed containing the log entry and timestamp
      const embed = new EmbedBuilder()
        .setColor(color)
        .setTitle(`${emojis.resolve(this.client, level.toLowerCase(), guildId) || emoji} ${level}`)
        .setDescription(message)
        .setFooter({ text: "Advanced Logger System" })
        .setTimestamp();

      await channel.send({ embeds: [embed] });
    } catch (err) {
      // Fallback: surface failure to console only — never re-enter the logger loop
      console.error(`\x1b[31m${this.prefix}\x1b[0m Failed to broadcast log to Discord channel ${channelId}:`, err.message);
    }
  }

  /**
   * Log info events specifically for a guild.
   */
  async guildInfo(guildId, message, metadata = {}) {
    const timestamp = new Date().toISOString();
    console.log(`\x1b[32m${this.prefix}\x1b[0m [INFO] [GUILD:${guildId}] [${timestamp}] ${message}`, Object.keys(metadata).length ? metadata : "");
    await this._broadcastToDiscord("INFO", message, 0x3b82f6, emojis.global.info, guildId);
  }

  /**
   * Log warn events specifically for a guild.
   */
  async guildWarn(guildId, message, metadata = {}) {
    const timestamp = new Date().toISOString();
    console.warn(`\x1b[33m${this.prefix}\x1b[0m [WARN] [GUILD:${guildId}] [${timestamp}] ${message}`, Object.keys(metadata).length ? metadata : "");
    await this._broadcastToDiscord("WARN", message, 0xf59e0b, emojis.global.support, guildId);
  }

  /**
   * Log error events specifically for a guild.
   */
  async guildError(guildId, message, metadata = {}) {
    const timestamp = new Date().toISOString();
    console.error(`\x1b[31m${this.prefix}\x1b[0m [ERROR] [GUILD:${guildId}] [${timestamp}] ${message}`, Object.keys(metadata).length ? metadata : "");
    await this._broadcastToDiscord("ERROR", message, 0xef4444, emojis.global.error, guildId);
  }
}

module.exports = Logger;
