/**
 * @file core_commands/ticket-config.js
 * @description Command to configure the advanced ticket system.
 *
 * © 2026 Cortex HQ & bot-hosting.net
 */

const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const Emojis = require("../config/emojis");
const storage = require("../utils/storage");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("Configure the advanced ticket system.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
      sub.setName("panel")
        .setDescription("Create a ticket creation panel in this channel.")
        .addStringOption(opt => opt.setName("title").setDescription("The title of the embed.").setRequired(true))
        .addStringOption(opt => opt.setName("description").setDescription("The description of the embed.").setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName("config")
        .setDescription("Set technical configurations for tickets.")
        .addRoleOption(opt => opt.setName("staff-role").setDescription("The role allowed to claim and manage tickets.").setRequired(true))
        .addChannelOption(opt => opt.setName("category").setDescription("The category where tickets will be created.").setRequired(false))
        .addChannelOption(opt => opt.setName("logs").setDescription("The channel to send closed ticket transcripts to.").setRequired(false))
    )
    .addSubcommand(sub =>
      sub.setName("status")
        .setDescription("View current ticket configuration.")
    ),

  /**
   * Execute the ticket command.
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   * @param {import('discord.js').Client} client
   */
  async execute(interaction, client) {
    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guildId;
    const config = storage.get("tickets", guildId) || { staffRoleId: null };

    if (subcommand === "panel") {
      if (!config.staffRoleId) {
        return interaction.reply({
          content: `${Emojis.resolve(client, "error", guildId)} You must configure the staff role using \`/ticket config\` first!`,
          flags: MessageFlags.Ephemeral
        });
      }

      const title = interaction.options.getString("title");
      const description = interaction.options.getString("description");

      const embed = new EmbedBuilder()
        .setColor(0x3b82f6)
        .setTitle(title)
        .setDescription(description)
        .setFooter({ text: "Community Support Matrix" })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("ticket_open").setLabel("Create Ticket").setStyle(ButtonStyle.Primary).setEmoji("📩")
      );

      await interaction.channel.send({ embeds: [embed], components: [row] });

      return interaction.reply({
        content: `${Emojis.resolve(client, "success", guildId)} Ticket panel has been deployed.`,
        flags: MessageFlags.Ephemeral
      });
    }

    if (subcommand === "config") {
      const staffRole = interaction.options.getRole("staff-role");
      const category = interaction.options.getChannel("category");
      const logs = interaction.options.getChannel("logs");

      config.staffRoleId = staffRole.id;
      if (category) config.categoryId = category.id;
      if (logs) config.logsChannelId = logs.id;

      storage.set("tickets", guildId, config);

      return interaction.reply({
        content: `${Emojis.resolve(client, "success", guildId)} **Ticket Configuration Updated!**\nStaff Role: <@&${staffRole.id}>\nCategory: ${category ? `<#${category.id}>` : "`None (Root)`"}\nLogs: ${logs ? `<#${logs.id}>` : "`Audit Log Channel`"}`,
        flags: MessageFlags.Ephemeral
      });
    }

    if (subcommand === "status") {
      const botConfig = storage.get("bot_identity", guildId) || {};
      const embed = new EmbedBuilder()
        .setColor(botConfig.embedColor ? parseInt(botConfig.embedColor, 16) : 0x3b82f6)
        .setTitle(`${Emojis.resolve(client, "web", guildId)} Ticket System Status`)
        .addFields(
          { name: "Staff Role", value: config.staffRoleId ? `<@&${config.staffRoleId}>` : "❌ `Not Set`", inline: true },
          { name: "Category", value: config.categoryId ? `<#${config.categoryId}>` : "`None`", inline: true },
          { name: "Logs Channel", value: config.logsChannelId ? `<#${config.logsChannelId}>` : "`Audit Logs`", inline: true }
        )
        .setTimestamp();

      return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }
  }
};
