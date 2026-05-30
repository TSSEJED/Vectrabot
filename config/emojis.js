/**
 * @file config/emojis.js
 * @description Centralized emoji configuration directory for the Vectrabot partnership template.
 * Separates standard global Unicode fallbacks from structured, custom Discord Guild snowflake identifiers.
 * This object is deeply frozen to ensure immutability and runtime stability.
 * 
 * © 2026 Cortex HQ & bot-hosting.net
 */

const storage = require("../utils/storage");

const EMOJIS = {
  // Global Unicode fallback symbols to display on any client/guild without custom uploads.
  global: {
    success: "✅",     // Operation completed successfully
    error: "❌",       // Operation failed/error encountered
    loading: "⏳",     // Asynchronous processing or loading state
    info: "ℹ️",        // Information status notification
    support: "🤝",     // Customer support / partnership helper
    links: "🔗",       // External website hyperlinking
    network: "🌐",     // Network latency / status metrics
    web: "🖥️",         // Web interface / dashboard reference
    satellite: "📡",   // API polling or gateway connection
    hardware: "⚙️",     // Infrastructure / server hardware stats
    refresh: "🔄"      // Cache invalidation or hot-reloading
  },

  // Structured custom Discord Guild snowflake placeholder identifiers.
  // These represent custom animated or static emojis uploaded to a specific guild,
  // mapping to the standard Discord emoji message syntax: <:name:snowflake_id>
  custom: {
    success: "<:cortex_success:000000000000000000>",
    error: "<:cortex_error:000000000000000000>",
    loading: "<:cortex_loading:000000000000000000>",
    info: "<:cortex_info:000000000000000000>",
    support: "<:cortex_partnership:000000000000000000>",
    links: "<:cortex_link:000000000000000000>",
    network: "<:cortex_network:000000000000000000>",
    web: "<:cortex_web:000000000000000000>",
    satellite: "<:cortex_satellite:000000000000000000>",
    hardware: "<:cortex_hardware:000000000000000000>",
    refresh: "<:cortex_refresh:000000000000000000>"
  }
};

// Deep freeze helper to make the config object completely immutable.
function deepFreeze(obj) {
  Object.keys(obj).forEach((name) => {
    const prop = obj[name];
    if (typeof prop === "object" && prop !== null) {
      deepFreeze(prop);
    }
  });
  return Object.freeze(obj);
}

// Export the deeply frozen, immutable emojis asset directory with a dynamic resolver function.
module.exports = {
  ...deepFreeze(EMOJIS),

  /**
   * Resolves the target emoji name. If the custom Discord snowflake is present in the client's
   * emoji cache (meaning the bot is in a guild with access to it), it returns the custom emoji;
   * otherwise, it falls back to the global Unicode fallback character.
   * @param {import('discord.js').Client} client - The active Discord client.
   * @param {string} name - The name of the emoji to resolve.
   * @param {string} [guildId] - Optional guild ID to check for custom emoji settings.
   * @returns {string} The formatted Discord custom emoji string or global Unicode fallback character.
   */
  resolve(client, name, guildId) {
    // Check if custom emojis are enabled for the specific guild (default: enabled if not specified)
    const customEnabled = guildId ? storage.get("settings", `custom_emojis_${guildId}`) !== false : true;

    if (customEnabled) {
      // 1. Check for guild-specific override in persistent storage
      if (guildId) {
        const guildEmojis = storage.get("custom_emoji_mappings", guildId);
        if (guildEmojis && guildEmojis[name]) {
          return guildEmojis[name];
        }
      }

      // 2. Fall back to template-defined custom emoji
      const customString = EMOJIS.custom[name];
      if (customString) {
        const match = customString.match(/:(\d+)>$/);
        if (match) {
          const emojiId = match[1];
          if (client.emojis.cache.has(emojiId)) {
            return customString;
          }
        }
      }
    }

    // 3. Fall back to global Unicode character
    return EMOJIS.global[name] || "";
  }
};
