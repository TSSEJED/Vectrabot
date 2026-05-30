/**
 * @file core_commands/uptime.js
 * @description Slash command to calculate bot process lifetime duration.
 * 
 * © 2026 Cortex HQ & bot-hosting.net
 */

const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const Emojis = require("../config/emojis");
const storage = require("../utils/storage");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("uptime")
    .setDescription("Displays the continuous uptime of the bot's system host."),

  /**
   * Execute the uptime command.
   * @param {import('discord.js').ChatInputCommandInteraction} interaction 
   * @param {import('discord.js').Client} client 
   */
  async execute(interaction, client) {
    const totalSeconds = Math.floor(process.uptime());
    
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const durationText = [
      days > 0 ? `\`${days}\` days` : null,
      hours > 0 ? `\`${hours}\` hours` : null,
      minutes > 0 ? `\`${minutes}\` minutes` : null,
      `\`${seconds}\` seconds`
    ].filter(Boolean).join(", ");

    const botConfig = storage.get("bot_identity", interaction.guildId) || {};
    const botName = botConfig.displayName || process.env.BOT_NAME || "Bot";

    const embed = new EmbedBuilder()
      .setColor(botConfig.embedColor ? parseInt(botConfig.embedColor, 16) : 0x3b82f6) // Theme blue
      .setTitle(`${Emojis.resolve(client, "info", interaction.guildId)} Process Uptime`)
      .setDescription(`The bot system has been running continuously for:\n${durationText}`)
      .setFooter({ text: `${botName} Uptime Audit` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
