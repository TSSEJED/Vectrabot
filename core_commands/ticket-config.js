/**
 * @file core_commands/ticket-config.js
 * @description Command to configure the advanced ticket system.
 *
 * © 2026 Cortex HQ & bot-hosting.net
 */

const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require("discord.js");
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
        .addStringOption(opt => opt.setName("title").setDescription("The title of the panel.").setRequired(true))
        .addStringOption(opt => opt.setName("description").setDescription("The description of the panel.").setRequired(true))
        .addStringOption(opt => opt.setName("button_label").setDescription("Custom label for the open button.").setRequired(false))
        .addStringOption(opt => opt.setName("button_emoji").setDescription("Custom emoji for the open button.").setRequired(false))
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
    const botConfig = storage.get("bot_identity", guildId) || {};
    const accentColor = botConfig.embedColor ? parseInt(botConfig.embedColor, 16) : 0x3b82f6;

    if (subcommand === "panel") {
      if (!config.staffRoleId) {
        return interaction.reply({
          content: `${Emojis.resolve(client, "error", guildId)} You must configure the staff role using \`/ticket config\` first!`,
          flags: MessageFlags.Ephemeral
        });
      }

      const title = interaction.options.getString("title");
      const description = interaction.options.getString("description");
      const buttonLabel = interaction.options.getString("button_label") || "Create Ticket";
      const buttonEmoji = interaction.options.getString("button_emoji") || "📩";

      const payload = {
        flags: 1 << 15,
        components: [
          {
            type: 17,
            accent_color: accentColor,
            components: [
              { type: 10, content: `# ${title}` },
              { type: 14 },
              { type: 10, content: description },
              { type: 14 },
              {
                type: 1,
                components: [
                  {
                    type: 2,
                    style: 1,
                    custom_id: "ticket_open",
                    label: buttonLabel,
                    emoji: { name: buttonEmoji.includes(":") ? buttonEmoji.split(":")[1] : buttonEmoji, id: buttonEmoji.includes(":") ? buttonEmoji.split(":")[2].replace(">", "") : null }
                  }
                ]
              }
            ]
          }
        ]
      };

      // Handle emoji better
      const emojiMatch = buttonEmoji.match(/<a?:.+:(\d+)>/);
      if (emojiMatch) {
        payload.components[0].components[4].components[0].emoji = { id: emojiMatch[1] };
      } else {
        payload.components[0].components[4].components[0].emoji = { name: buttonEmoji };
      }

      await interaction.channel.send(payload);

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
        flags: 1 << 15,
        components: [{
          type: 17,
          accent_color: 0x10b981,
          components: [
            { type: 10, content: `# ${Emojis.resolve(client, "success", guildId)} Ticket Configuration Updated!` },
            { type: 14 },
            { type: 10, content: `**Staff Role:** <@&${staffRole.id}>\n**Category:** ${category ? `<#${category.id}>` : "`None (Root)`"}\n**Logs:** ${logs ? `<#${logs.id}>` : "`Audit Log Channel`"}` }
          ]
        }],
        flags: MessageFlags.Ephemeral
      });
    }

    if (subcommand === "status") {
      return interaction.reply({
        flags: 1 << 15,
        components: [{
          type: 17,
          accent_color: accentColor,
          components: [
            { type: 10, content: `# ${Emojis.resolve(client, "web", guildId)} Ticket System Status` },
            { type: 14 },
            { type: 10, content: `**Staff Role:** ${config.staffRoleId ? `<@&${config.staffRoleId}>` : "❌ `Not Set`"}\n**Category:** ${config.categoryId ? `<#${config.categoryId}>` : "`None`"}\n**Logs Channel:** ${config.logsChannelId ? `<#${config.logsChannelId}>` : "`Audit Logs`"}` }
          ]
        }],
        flags: MessageFlags.Ephemeral
      });
    }
  }
};
