/**
 * @file addons/moderation/moderation.js
 * @description Advanced Moderation Suite including warnings, bans, and timeouts.
 * Uses Discord Components V2 for rich interaction.
 *
 * © 2026 Cortex HQ & bot-hosting.net
 */

const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, EmbedBuilder } = require("discord.js");
const Emojis = require("../../config/emojis");
const storage = require("../../utils/storage");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("mod")
    .setDescription("Advanced moderation command suite.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    // --- Warnings ---
    .addSubcommand(sub =>
      sub.setName("warn")
        .setDescription("Issue a formal warning to a member.")
        .addUserOption(opt => opt.setName("user").setDescription("The user to warn.").setRequired(true))
        .addStringOption(opt => opt.setName("reason").setDescription("Reason for the warning.").setRequired(false))
    )
    .addSubcommand(sub =>
      sub.setName("delwarn")
        .setDescription("Remove a specific warning from a user.")
        .addUserOption(opt => opt.setName("user").setDescription("The user whose warning to remove.").setRequired(true))
        .addStringOption(opt => opt.setName("id").setDescription("The unique ID of the warning.").setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName("modlogs")
        .setDescription("View moderation history for a user.")
        .addUserOption(opt => opt.setName("user").setDescription("The user to check.").setRequired(true))
    )
    // --- Bans ---
    .addSubcommand(sub =>
      sub.setName("ban")
        .setDescription("Ban a member from the server.")
        .addUserOption(opt => opt.setName("user").setDescription("The user to ban.").setRequired(true))
        .addStringOption(opt => opt.setName("reason").setDescription("Reason for the ban.").setRequired(false))
        .addIntegerOption(opt => opt.setName("delete_messages").setDescription("Days of messages to delete (0-7).").setMinValue(0).setMaxValue(7))
    )
    .addSubcommand(sub =>
      sub.setName("unban")
        .setDescription("Unban a user from the server.")
        .addStringOption(opt => opt.setName("id").setDescription("The Discord ID of the user to unban.").setRequired(true))
        .addStringOption(opt => opt.setName("reason").setDescription("Reason for the unban.").setRequired(false))
    )
    .addSubcommand(sub =>
      sub.setName("timeban")
        .setDescription("Temporarily ban a member.")
        .addUserOption(opt => opt.setName("user").setDescription("The user to ban.").setRequired(true))
        .addStringOption(opt => opt.setName("duration").setDescription("Ban duration (e.g., 1h, 1d).").setRequired(true))
        .addStringOption(opt => opt.setName("reason").setDescription("Reason for the temporary ban.").setRequired(false))
    )
    // --- Timeouts ---
    .addSubcommand(sub =>
      sub.setName("mute")
        .setDescription("Timeout a member (modern mute).")
        .addUserOption(opt => opt.setName("user").setDescription("The user to timeout.").setRequired(true))
        .addStringOption(opt => opt.setName("duration").setDescription("Timeout duration (e.g., 10m, 1h).").setRequired(true))
        .addStringOption(opt => opt.setName("reason").setDescription("Reason for the timeout.").setRequired(false))
    )
    .addSubcommand(sub =>
      sub.setName("unmute")
        .setDescription("Remove a timeout from a member.")
        .addUserOption(opt => opt.setName("user").setDescription("The user to unmute.").setRequired(true))
        .addStringOption(opt => opt.setName("reason").setDescription("Reason for removing the timeout.").setRequired(false))
    )
    .addSubcommand(sub =>
      sub.setName("timeout")
        .setDescription("Alias for /mod mute.")
        .addUserOption(opt => opt.setName("user").setDescription("The user to timeout.").setRequired(true))
        .addStringOption(opt => opt.setName("duration").setDescription("Timeout duration.").setRequired(true))
        .addStringOption(opt => opt.setName("reason").setDescription("Reason for the timeout.").setRequired(false))
    )
    .addSubcommand(sub =>
      sub.setName("untimeout")
        .setDescription("Alias for /mod unmute.")
        .addUserOption(opt => opt.setName("user").setDescription("The user to unmute.").setRequired(true))
        .addStringOption(opt => opt.setName("reason").setDescription("Reason for removing the timeout.").setRequired(false))
    ),

  /**
   * Execute moderation commands.
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   * @param {import('discord.js').Client} client
   */
  async execute(interaction, client) {
    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guildId;
    const botConfig = storage.get("bot_identity", guildId) || {};
    const accentColor = botConfig.embedColor ? parseInt(botConfig.embedColor, 16) : 0x3b82f6;

    /**
     * Helper to log moderation actions to the configured moderation log channel.
     */
    const logAction = async (action, target, reason, extra = {}) => {
      const logsConfig = storage.get("logs", guildId) || {};
      if (logsConfig.moderation_enabled === false || botConfig.loggingEnabled === false) return;

      const embed = new EmbedBuilder()
        .setColor(action.includes("un") || action.includes("del") ? 0x10b981 : 0xef4444)
        .setTitle(`${Emojis.resolve(client, "info", guildId)} Moderation Action: ${action.toUpperCase()}`)
        .addFields(
          { name: "Target", value: `${target.tag} (\`${target.id}\`)`, inline: true },
          { name: "Moderator", value: `${interaction.user.tag}`, inline: true },
          { name: "Reason", value: reason }
        )
        .setTimestamp();

      if (Object.keys(extra).length) {
        for (const [key, value] of Object.entries(extra)) {
          embed.addFields({ name: key, value: String(value), inline: true });
        }
      }

      await client.logger.broadcastEmbed(guildId, "moderation", embed);
    };

    // Helper for duration parsing
    const parseDuration = (input) => {
      const msMap = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
      const match = input.match(/^(\d+)([smhd])$/);
      if (!match) return null;
      return parseInt(match[1]) * msMap[match[2]];
    };

    // --- Warning Management ---
    if (subcommand === "warn") {
      const target = interaction.options.getUser("user");
      const reason = interaction.options.getString("reason") || "No reason provided.";

      const warnings = storage.get("warnings", `${guildId}_${target.id}`) || [];
      const warnId = Math.random().toString(36).substring(2, 8).toUpperCase();

      const newWarn = {
        id: warnId,
        moderatorId: interaction.user.id,
        reason,
        timestamp: Date.now()
      };

      warnings.push(newWarn);
      storage.set("warnings", `${guildId}_${target.id}`, warnings);

      await logAction("warn", target, reason, { "Warning ID": warnId });

      // Try to DM the user
      await target.send({
        content: `${Emojis.resolve(client, "error", guildId)} You have been warned in **${interaction.guild.name}**.\n**Reason:** ${reason}\n**Warning ID:** \`${warnId}\``
      }).catch(() => null);

      return interaction.reply({
        flags: 1 << 15,
        components: [{
          type: 17,
          accent_color: 0xf59e0b, // Amber
          components: [
            { type: 10, content: `# ${Emojis.resolve(client, "support", guildId)} Warning Issued` },
            { type: 14 },
            { type: 10, content: `**Target:** ${target.tag} (\`${target.id}\`)\n**Moderator:** ${interaction.user.tag}\n**Warning ID:** \`${warnId}\`\n**Reason:** ${reason}` }
          ]
        }]
      });
    }

    if (subcommand === "delwarn") {
      const target = interaction.options.getUser("user");
      const warnId = interaction.options.getString("id");

      let warnings = storage.get("warnings", `${guildId}_${target.id}`) || [];
      const initialCount = warnings.length;
      warnings = warnings.filter(w => w.id !== warnId);

      if (warnings.length === initialCount) {
        return interaction.reply({
          content: `${Emojis.resolve(client, "error", guildId)} No warning found with ID \`${warnId}\` for user ${target.tag}.`,
          flags: MessageFlags.Ephemeral
        });
      }

      storage.set("warnings", `${guildId}_${target.id}`, warnings);
      await logAction("delwarn", target, "Warning removed by moderator.", { "Warning ID": warnId });

      // Notify User
      await target.send({
        content: `${Emojis.resolve(client, "success", guildId)} One of your warnings has been removed in **${interaction.guild.name}**.\n**Warning ID:** \`${warnId}\``
      }).catch(() => null);

      return interaction.reply({
        flags: 1 << 15,
        components: [{
          type: 17,
          accent_color: 0x10b981, // Green
          components: [
            { type: 10, content: `# ${Emojis.resolve(client, "success", guildId)} Warning Deleted` },
            { type: 14 },
            { type: 10, content: `Warning \`${warnId}\` has been successfully removed from **${target.tag}**.` }
          ]
        }]
      });
    }

    if (subcommand === "modlogs") {
      const target = interaction.options.getUser("user");
      const warnings = storage.get("warnings", `${guildId}_${target.id}`) || [];

      let historyText = "";
      if (warnings.length === 0) {
        historyText = "This user has a clean record in this guild.";
      } else {
        historyText = warnings.map(w =>
          `**ID:** \`${w.id}\` | **Mod:** <@${w.moderatorId}>\n**Date:** <t:${Math.floor(w.timestamp / 1000)}:R>\n**Reason:** ${w.reason}`
        ).join("\n\n").slice(0, 4000);
      }

      return interaction.reply({
        flags: 1 << 15,
        components: [{
          type: 17,
          accent_color: accentColor,
          components: [
            { type: 10, content: `# ${Emojis.resolve(client, "info", guildId)} Moderation History: ${target.tag}` },
            { type: 14 },
            { type: 10, content: historyText }
          ]
        }]
      });
    }

    // --- Ban Management ---
    if (subcommand === "ban" || subcommand === "timeban") {
      const targetUser = interaction.options.getUser("user");
      const reason = interaction.options.getString("reason") || "No reason provided.";
      const deleteDays = interaction.options.getInteger("delete_messages") || 0;

      const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
      if (member && !member.bannable) {
        return interaction.reply({
          content: `${Emojis.resolve(client, "error", guildId)} I do not have permission to ban this member.`,
          flags: MessageFlags.Ephemeral
        });
      }

      let durationMs = null;
      let durationStr = "";
      if (subcommand === "timeban") {
        durationStr = interaction.options.getString("duration");
        durationMs = parseDuration(durationStr);
        if (!durationMs) {
          return interaction.reply({
            content: `${Emojis.resolve(client, "error", guildId)} Invalid duration format. Use \`1h\`, \`1d\`, etc.`,
            flags: MessageFlags.Ephemeral
          });
        }
      }

      // DM user first
      await targetUser.send({
        content: `${Emojis.resolve(client, "error", guildId)} You have been banned from **${interaction.guild.name}**.\n**Reason:** ${reason}${durationMs ? `\n**Duration:** ${durationStr}` : ""}`
      }).catch(() => null);

      await interaction.guild.members.ban(targetUser.id, {
        reason: `${interaction.user.tag}: ${reason}`,
        deleteMessageSeconds: deleteDays * 24 * 60 * 60
      });

      if (durationMs) {
        const unbanTime = Date.now() + durationMs;
        const timedActions = storage.get("timed_actions", "bans") || [];
        timedActions.push({
          guildId,
          userId: targetUser.id,
          unbanTime
        });
        storage.set("timed_actions", "bans", timedActions);

        // Also set a local timeout for immediate unban if bot stays online
        setTimeout(async () => {
          try {
            await interaction.guild.members.unban(targetUser.id, "Temporary ban expired.");
            // Notify User
            await targetUser.send({
              content: `${Emojis.resolve(client, "success", guildId)} Your temporary ban in **${interaction.guild.name}** has expired.`
            }).catch(() => null);

            let currentActions = storage.get("timed_actions", "bans") || [];
            currentActions = currentActions.filter(a => !(a.guildId === guildId && a.userId === targetUser.id));
            storage.set("timed_actions", "bans", currentActions);
          } catch (e) {}
        }, durationMs);
      }

      await logAction(subcommand, targetUser, reason, durationMs ? { "Duration": durationStr } : {});

      return interaction.reply({
        flags: 1 << 15,
        components: [{
          type: 17,
          accent_color: 0xef4444, // Red
          components: [
            { type: 10, content: `# ${Emojis.resolve(client, "error", guildId)} User Banned` },
            { type: 14 },
            { type: 10, content: `Successfully ${subcommand === "timeban" ? "temporarily " : ""}banned **${targetUser.tag}**.\n**Reason:** ${reason}${durationMs ? `\n**Duration:** ${durationStr}` : ""}` }
          ]
        }]
      });
    }

    if (subcommand === "unban") {
      const targetId = interaction.options.getString("id");
      const reason = interaction.options.getString("reason") || "No reason provided.";

      try {
        await interaction.guild.members.unban(targetId, `${interaction.user.tag}: ${reason}`);

        // Notify User
        const user = await client.users.fetch(targetId).catch(() => null);
        if (user) {
          await user.send({
            content: `${Emojis.resolve(client, "success", guildId)} You have been unbanned from **${interaction.guild.name}**.\n**Reason:** ${reason}`
          }).catch(() => null);
          await logAction("unban", user, reason);
        }

        // Remove from timed actions if present
        let currentActions = storage.get("timed_actions", "bans") || [];
        currentActions = currentActions.filter(a => !(a.guildId === guildId && a.userId === targetId));
        storage.set("timed_actions", "bans", currentActions);

        return interaction.reply({
          flags: 1 << 15,
          components: [{
            type: 17,
            accent_color: 0x10b981, // Green
            components: [
              { type: 10, content: `# ${Emojis.resolve(client, "success", guildId)} User Unbanned` },
              { type: 14 },
              { type: 10, content: `Successfully unbanned user ID \`${targetId}\`.\n**Reason:** ${reason}` }
            ]
          }]
        });
      } catch (error) {
        return interaction.reply({
          content: `${Emojis.resolve(client, "error", guildId)} Failed to unban user. Ensure the ID is correct and they are actually banned.`,
          flags: MessageFlags.Ephemeral
        });
      }
    }

    // --- Timeout/Mute Management ---
    if (subcommand === "mute" || subcommand === "timeout") {
      const targetUser = interaction.options.getUser("user");
      const durationStr = interaction.options.getString("duration");
      const reason = interaction.options.getString("reason") || "No reason provided.";

      const durationMs = parseDuration(durationStr);
      if (!durationMs) {
        return interaction.reply({
          content: `${Emojis.resolve(client, "error", guildId)} Invalid duration format.`,
          flags: MessageFlags.Ephemeral
        });
      }

      const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
      if (!member) {
        return interaction.reply({ content: "Member not found.", flags: MessageFlags.Ephemeral });
      }

      if (!member.moderatable) {
        return interaction.reply({
          content: `${Emojis.resolve(client, "error", guildId)} I cannot timeout this member.`,
          flags: MessageFlags.Ephemeral
        });
      }

      await member.timeout(durationMs, `${interaction.user.tag}: ${reason}`);

      await targetUser.send({
        content: `${Emojis.resolve(client, "error", guildId)} You have been timed out in **${interaction.guild.name}** for **${durationStr}**.\n**Reason:** ${reason}`
      }).catch(() => null);

      await logAction("mute", targetUser, reason, { "Duration": durationStr });

      return interaction.reply({
        flags: 1 << 15,
        components: [{
          type: 17,
          accent_color: 0xf59e0b, // Amber
          components: [
            { type: 10, content: `# ${Emojis.resolve(client, "support", guildId)} User Muted` },
            { type: 14 },
            { type: 10, content: `**${targetUser.tag}** has been timed out for ${durationStr}.\n**Reason:** ${reason}` }
          ]
        }]
      });
    }

    if (subcommand === "unmute" || subcommand === "untimeout") {
      const targetUser = interaction.options.getUser("user");
      const reason = interaction.options.getString("reason") || "No reason provided.";

      const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
      if (!member) {
        return interaction.reply({ content: "Member not found.", flags: MessageFlags.Ephemeral });
      }

      await member.timeout(null, `${interaction.user.tag}: ${reason}`);

      // Notify User
      await targetUser.send({
        content: `${Emojis.resolve(client, "success", guildId)} Your timeout in **${interaction.guild.name}** has been removed.`
      }).catch(() => null);

      await logAction("unmute", targetUser, reason);

      return interaction.reply({
        flags: 1 << 15,
        components: [{
          type: 17,
          accent_color: 0x10b981, // Green
          components: [
            { type: 10, content: `# ${Emojis.resolve(client, "success", guildId)} User Unmuted` },
            { type: 14 },
            { type: 10, content: `Successfully removed timeout from **${targetUser.tag}**.` }
          ]
        }]
      });
    }
  }
};
