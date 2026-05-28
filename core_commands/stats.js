/**
 * @file core_commands/stats.js
 * @description Slash command displaying system hardware metrics, discord.js, and host status.
 * 
 * © 2026 Cortex HQ & bot-hosting.net
 */

const { SlashCommandBuilder, EmbedBuilder, version: djsVersion } = require("discord.js");
const os = require("os");
const Emojis = require("../config/emojis");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("stats")
    .setDescription("Outputs the hardware performance and cache metrics of the host system."),

  /**
   * Execute the stats command.
   * @param {import('discord.js').ChatInputCommandInteraction} interaction 
   * @param {import('discord.js').Client} client 
   */
  async execute(interaction, client) {
    // 1. Gather memory metrics
    const memoryRss = (process.memoryUsage().rss / 1024 / 1024).toFixed(2); // MB
    const totalMemory = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2); // GB
    
    // 2. Load average (fallback for Windows where loadavg is [0,0,0])
    const cpus = os.cpus();
    const cpuModel = cpus[0] ? cpus[0].model : "Unknown CPU";
    const cores = cpus.length;

    // 3. Guilds & users cache total
    const guildCount = client.guilds.cache.size;
    const userCount = client.users.cache.size;
    const channelCount = client.channels.cache.size;

    const embed = new EmbedBuilder()
      .setColor(0x3b82f6)
      .setTitle(`${Emojis.global.web} System Specifications & Stats`)
      .setThumbnail(client.user.displayAvatarURL())
      .addFields(
        { name: "🤖 Client Metrics", value: `• **Guilds:** ${guildCount}\n• **Cached Users:** ${userCount}\n• **Cached Channels:** ${channelCount}`, inline: true },
        { name: "💻 Host Platform", value: `• **Platform:** ${os.platform()} (${os.arch()})\n• **Cores:** ${cores}x\n• **Model:** \`${cpuModel.trim()}\``, inline: true },
        { name: "📊 Software & Hardware", value: `• **Node.js:** \`${process.version}\`\n• **Discord.js:** \`v${djsVersion}\`\n• **Memory (RSS):** \`${memoryRss} MB\` / \`${totalMemory} GB\``, inline: false }
      )
      .setFooter({ text: `${process.env.BOT_NAME || "Bot"} Diagnostics Suite` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
