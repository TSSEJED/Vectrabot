/**
 * @file core_commands/ping.js
 * @description Slash command to calculate gateway and connection latency.
 * 
 * © 2026 Cortex HQ & bot-hosting.net
 */

const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const Emojis = require("../config/emojis");
const storage = require("../utils/storage");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Measures the bot's API round-trip latency and WebSocket heartbeat."),

  /**
   * Execute the ping command.
   * @param {import('discord.js').ChatInputCommandInteraction} interaction 
   * @param {import('discord.js').Client} client 
   */
  async execute(interaction, client) {
    const sent = await interaction.deferReply({ fetchReply: true });
    
    const roundTrip = sent.createdTimestamp - interaction.createdTimestamp;
    const heartbeat = client.ws.ping;

    const botConfig = storage.get("bot_identity", interaction.guildId) || {};
    const botName = botConfig.displayName || process.env.BOT_NAME || "Bot";

    const embed = new EmbedBuilder()
      .setColor(botConfig.embedColor ? parseInt(botConfig.embedColor, 16) : 0x3b82f6) // Theme blue
      .setTitle(`${Emojis.resolve(client, "satellite", interaction.guildId)} Connection Diagnostics`)
      .addFields(
        { name: "API Latency", value: `\`${roundTrip}ms\``, inline: true },
        { name: "WebSocket Heartbeat", value: `\`${heartbeat}ms\``, inline: true }
      )
      .setFooter({ text: `${botName} Systems` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }
};
