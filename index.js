/**
 * @file index.js
 * @description Core entry point and bootloader for the Vectrabot partnership template.
 * Sets up intent permissions, dynamically scans and validates commands/addons directories,
 * synchronizes application commands globally with the Discord REST API, and routes slash events.
 * 
 * © 2026 Cortex HQ & bot-hosting.net
 */

// Load dotenv environment variables if present (useful for local development)
require("dotenv").config({ path: ".env" });

const fs = require("fs");
const path = require("path");
const { Client, GatewayIntentBits, Collection, REST, Routes, MessageFlags } = require("discord.js");
const Emojis = require("./config/emojis");
const Logger = require("./utils/logger");
const storage = require("./utils/storage");

// 1. Initialize the Discord Client with precise modern GatewayIntentBits
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,           // Required for core guild state, channels, slash commands
    GatewayIntentBits.GuildMessages,    // Required for guild-level message management
    GatewayIntentBits.GuildMembers,     // Required for advanced member auditing & join tracking
    GatewayIntentBits.GuildPresences,   // Required for real-time status & activity diagnostics
    GatewayIntentBits.GuildVoiceStates, // Required for join-to-create voice automation
    GatewayIntentBits.MessageContent    // Required for reading message content when authorized
  ]
});

// Attach command memory database structures
client.commands = new Collection();
client.giveaways = new Collection(); // In-memory store for active giveaway participant pools

// 2. Initialize and attach the centralized Logger class
client.logger = new Logger(client);

// 3. Define and ensure bootstrap paths exist
const CORE_DIR = path.join(__dirname, "core_commands");
const ADDONS_DIR = path.join(__dirname, "addons");

if (!fs.existsSync(CORE_DIR)) {
  fs.mkdirSync(CORE_DIR, { recursive: true });
}
if (!fs.existsSync(ADDONS_DIR)) {
  fs.mkdirSync(ADDONS_DIR, { recursive: true });
}

/**
 * Scan a target directory, validate Command structural signature, and register to collection.
 * @param {string} dirPath - The absolute directory path to scan.
 * @param {string} namespace - Logger identifier tag ('Core' or 'Addon').
 */
function loadCommandsFromDirectory(dirPath, namespace) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const filePath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      // Dynamically recurse into category subdirectories
      loadCommandsFromDirectory(filePath, namespace);
    } else if (entry.isFile() && entry.name.endsWith(".js")) {
      try {
        // Clear require cache to enable hot reloading support if required
        delete require.cache[require.resolve(filePath)];
        const command = require(filePath);

        // Validate signature: Must contain 'data' schema and 'execute' handler
        if (command && typeof command === "object" && command.data && typeof command.execute === "function") {
          client.commands.set(command.data.name, command);
          client.logger.info(`Loaded ${namespace} Command: /${command.data.name} (from ${entry.name})`);
        } else {
          client.logger.warn(`Skipped invalid command structure at: ${entry.name} (Missing 'data' or 'execute' function)`);
        }
      } catch (error) {
        client.logger.error(`Failed to load command at ${entry.name} in ${namespace} context:`, { error: error.message });
      }
    }
  }
}

// Execute defensive command file bootloaders
loadCommandsFromDirectory(CORE_DIR, "Core");
loadCommandsFromDirectory(ADDONS_DIR, "Addon");

// 4. Initialize specialized addon logic (e.g., Audit Logs)
const auditLogs = require("./addons/utility/audit-logs");
if (auditLogs && typeof auditLogs.init === "function") {
  auditLogs.init(client);
  client.logger.info("Initialized specialized addon logic: AuditLogs");
}

const welcomeSystem = require("./addons/utility/welcome-system");
if (welcomeSystem && typeof welcomeSystem.init === "function") {
  welcomeSystem.init(client);
  client.logger.info("Initialized specialized addon logic: WelcomeSystem");
}

const ticketSystem = require("./addons/utility/tickets");

const jtcSystem = require("./addons/utility/join-to-create");
if (jtcSystem && typeof jtcSystem.init === "function") {
  jtcSystem.init(client);
  client.logger.info("Initialized specialized addon logic: JoinToCreate");
}

const serverStats = require("./addons/utility/server-stats");
if (serverStats && typeof serverStats.init === "function") {
  serverStats.init(client);
  client.logger.info("Initialized specialized addon logic: ServerStats");
}

// 5. Register the clientReady Lifecycle Hook to synchronize slash commands
// NOTE: discord.js v14+ renamed 'ready' to 'clientReady' to distinguish it
// from the raw Gateway READY packet. Using 'ready' still works but prints a
// DeprecationWarning; 'clientReady' is the correct modern event name.
client.once("clientReady", async () => {
  client.logger.info(`Successfully logged in as ${client.user.tag}! Synchronizing application command registries...`);

  // Recover timed bans from storage
  const timedBans = storage.get("timed_actions", "bans") || [];
  const activeBans = [];

  for (const ban of timedBans) {
    const remainingMs = ban.unbanTime - Date.now();
    if (remainingMs <= 0) {
      try {
        const guild = await client.guilds.fetch(ban.guildId).catch(() => null);
        if (guild) {
          await guild.members.unban(ban.userId, "Temporary ban expired while bot was offline.");
          client.logger.info(`Unbanned user ${ban.userId} in ${ban.guildId} (expired offline)`);
        }
      } catch (e) {}
    } else {
      activeBans.push(ban);
      setTimeout(async () => {
        try {
          const guild = await client.guilds.fetch(ban.guildId).catch(() => null);
          if (guild) {
            await guild.members.unban(ban.userId, "Temporary ban expired.");
            let currentActions = storage.get("timed_actions", "bans") || [];
            currentActions = currentActions.filter(a => !(a.guildId === ban.guildId && a.userId === ban.userId));
            storage.set("timed_actions", "bans", currentActions);
            client.logger.info(`Unbanned user ${ban.userId} in ${ban.guildId} (scheduled)`);
          }
        } catch (e) {}
      }, remainingMs);
    }
  }
  storage.set("timed_actions", "bans", activeBans);

  // Recover giveaways from storage
  const giveaways = storage.getAll("giveaways");
  for (const [id, data] of Object.entries(giveaways)) {
    if (data.status === "active") {
      const now = Math.floor(Date.now() / 1000);
      const remainingMs = (data.endTime - now) * 1000;

      if (remainingMs > 0) {
        client.giveaways.set(id, {
          ...data,
          participants: new Set(data.participants)
        });

        setTimeout(async () => {
          const activeGiveaway = client.giveaways.get(id);
          if (activeGiveaway) {
            const winners = [...activeGiveaway.participants]
              .sort(() => 0.5 - Math.random())
              .slice(0, activeGiveaway.winnersCount);

            client.giveaways.delete(id);

            const stored = storage.get("giveaways", id);
            if (stored) {
              stored.status = "ended";
              storage.set("giveaways", id, stored);
            }

            const channel = await client.channels.fetch(data.channelId).catch(() => null);
            if (channel) {
              if (winners.length === 0) {
                await channel.send({
                  content: `${Emojis.resolve(client, "error", data.guildId)} **Giveaway Concluded!**\nReward: **${data.prize}**\nResult: No winners could be determined as no users entered the giveaway matrix.\nGiveaway ID: \`${id}\``
                });
              } else {
                // DM Winners
                for (const winnerId of winners) {
                  const user = await client.users.fetch(winnerId).catch(() => null);
                  if (user) {
                    const guildName = (await client.guilds.fetch(data.guildId).catch(() => null))?.name || "a server";
                    await user.send({
                      content: `${Emojis.resolve(client, "success", data.guildId)} Congratulations! You won the giveaway for **${data.prize}** in **${guildName}**!`
                    }).catch(() => null);
                  }
                }

                await channel.send({
                  content: `${Emojis.resolve(client, "success", data.guildId)} **Giveaway Concluded!**\nReward: **${data.prize}**\nWinner(s): ${winners.map(uid => `<@${uid}>`).join(", ")}\nGiveaway ID: \`${id}\``
                });
              }
            }
          }
        }, remainingMs);
        client.logger.info(`Recovered active giveaway ${id}, ending in ${Math.round(remainingMs / 1000)}s`);
      } else {
        // Automatically end giveaways that expired while bot was offline
        data.status = "expired_offline";
        storage.set("giveaways", id, data);
        client.logger.info(`Giveaway ${id} expired while bot was offline.`);
      }
    }
  }

  // Map commands to standard JSON API structure
  const commandsData = client.commands.map(cmd => cmd.data.toJSON());

  const token = process.env.DISCORD_TOKEN;
  const clientId = process.env.DISCORD_CLIENT_ID;

  if (!token || !clientId) {
    client.logger.warn("DISCORD_TOKEN or DISCORD_CLIENT_ID not found in environmental variables. Skipping global API deployment.");
    return;
  }

  const rest = new REST({ version: "10" }).setToken(token);

  try {
    client.logger.info(`Started refreshing ${commandsData.length} application (/) commands globally.`);

    // Synchronize commands globally with Discord REST API
    const data = await rest.put(
      Routes.applicationCommands(clientId),
      { body: commandsData }
    );

    client.logger.info(`Successfully reloaded and registered ${data.length} global application (/) commands.`);
  } catch (error) {
    client.logger.error("Error occurred while deploying commands to Discord REST API:", { error: error.message });
  }
});

// 6. Build integrated slash commands router and event router
client.on("interactionCreate", async (interaction) => {
  // Route specialized Ticket interactions
  if (interaction.isButton() && interaction.customId.startsWith("ticket_")) {
    return ticketSystem.handleInteraction(interaction, client);
  }

  // Route Button Interactions
  if (interaction.isButton()) {
    if (interaction.customId === "ga_enter") {
      const messageId = interaction.message.id;
      const giveaway = client.giveaways.get(messageId);

      if (!giveaway) {
        return interaction.reply({
          content: `${Emojis.resolve(client, "error", interaction.guildId)} This giveaway matrix has expired or is no longer active in memory.`,
          flags: MessageFlags.Ephemeral
        });
      }

      if (giveaway.participants.has(interaction.user.id)) {
        return interaction.reply({
          content: `${Emojis.resolve(client, "error", interaction.guildId)} You have already entered this giveaway matrix.`,
          flags: MessageFlags.Ephemeral
        });
      }

      giveaway.participants.add(interaction.user.id);

      // Update persistent storage with new entry
      const stored = storage.get("giveaways", messageId);
      if (stored) {
        stored.participants = [...giveaway.participants];
        storage.set("giveaways", messageId, stored);
      }

      return interaction.reply({
        content: `${Emojis.resolve(client, "success", interaction.guildId)} Entry confirmed! You have successfully synchronized with the giveaway reward pool.`,
        flags: MessageFlags.Ephemeral
      });
    }
    return;
  }

  // Only route slash commands
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) {
    client.logger.warn(`Unregistered command interaction intercepted: /${interaction.commandName}`);
    return;
  }

  try {
    client.logger.command(`Executing command /${interaction.commandName} by ${interaction.user.tag} in Guild ${interaction.guildId || "DM"}`);
    await command.execute(interaction, client);
  } catch (error) {
    client.logger.error(`Downstream execution failure routing /${interaction.commandName}:`, { error: error.message, stack: error.stack });

    // Build user-friendly ephemeral error message using MessageFlags.Ephemeral
    // (the legacy `ephemeral: true` property is deprecated in discord.js v14+)
    const errorPayload = {
      content: `${Emojis.resolve(client, "error", interaction.guildId)} **System Error:** An error occurred while executing this command. Please try again later or contact support.`,
      flags: MessageFlags.Ephemeral
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(errorPayload).catch(() => null);
    } else {
      await interaction.reply(errorPayload).catch(() => null);
    }
  }
});

// 7. Connect to Discord Gateway
if (process.env.DISCORD_TOKEN) {
  client.login(process.env.DISCORD_TOKEN).catch(err => {
    console.error("[Cortex HQ Partnership] Authentication failed while logging into Discord Gateway:", err.message);
  });
} else {
  console.warn("[Cortex HQ Partnership] Warning: DISCORD_TOKEN is missing from environment. Bot cannot log in.");
}
