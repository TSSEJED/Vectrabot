/**
 * @file core_commands/jtc-config.js
 * @description Admin command to configure the Join to Create voice automation.
 *
 * © 2026 Cortex HQ & bot-hosting.net
 */

const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require("discord.js");
const Emojis = require("../config/emojis");
const storage = require("../utils/storage");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("jtc")
    .setDescription("Configure the Join to Create voice system.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
      sub.setName("setup")
        .setDescription("Set the trigger channel and optional category.")
        .addChannelOption(opt =>
          opt.setName("channel")
            .setDescription("The voice channel users join to create a new room.")
            .setRequired(true)
        )
        .addChannelOption(opt =>
          opt.setName("category")
            .setDescription("The category where new channels will be created.")
            .setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub.setName("status")
        .setDescription("View current JTC configuration.")
    )
    .addSubcommand(sub =>
      sub.setName("reset")
        .setDescription("Disable the JTC system for this server.")
    ),

  /**
   * Execute the jtc command.
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   * @param {import('discord.js').Client} client
   */
  async execute(interaction, client) {
    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guildId;

    if (subcommand === "setup") {
      const channel = interaction.options.getChannel("channel");
      const category = interaction.options.getChannel("category");

      if (channel.type !== 2) { // 2 = GuildVoice
        return interaction.reply({
          content: `${Emojis.resolve(client, "error", guildId)} The trigger channel must be a voice channel.`,
          flags: MessageFlags.Ephemeral
        });
      }

      if (category && category.type !== 4) { // 4 = GuildCategory
        return interaction.reply({
          content: `${Emojis.resolve(client, "error", guildId)} The specified category is invalid.`,
          flags: MessageFlags.Ephemeral
        });
      }

      storage.set("jtc", guildId, {
        channelId: channel.id,
        categoryId: category ? category.id : null
      });

      return interaction.reply({
        content: `${Emojis.resolve(client, "success", guildId)} **Join to Create Setup Complete!**\nTrigger Channel: <#${channel.id}>\nTarget Category: ${category ? `<#${category.id}>` : "Current"}`,
        flags: MessageFlags.Ephemeral
      });
    }

    if (subcommand === "reset") {
      storage.delete("jtc", guildId);
      return interaction.reply({
        content: `${Emojis.resolve(client, "success", guildId)} **Join to Create Disabled.**`,
        flags: MessageFlags.Ephemeral
      });
    }

    if (subcommand === "status") {
      const config = storage.get("jtc", guildId);
      if (!config) {
        return interaction.reply({
          content: `${Emojis.resolve(client, "error", guildId)} No JTC configuration found for this server.`,
          flags: MessageFlags.Ephemeral
        });
      }

      return interaction.reply({
        content: `### ${Emojis.resolve(client, "web", guildId)} JTC Configuration\n• **Trigger:** <#${config.channelId}>\n• **Category:** ${config.categoryId ? `<#${config.categoryId}>` : "`Follow Parent`"}`,
        flags: MessageFlags.Ephemeral
      });
    }
  }
};
