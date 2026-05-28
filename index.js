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

// 1. Initialize the Discord Client with precise modern GatewayIntentBits
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,           // Required for core guild state, channels, slash commands
    GatewayIntentBits.GuildMessages,    // Required for guild-level message management
    GatewayIntentBits.MessageContent    // Required for reading message content when authorized
  ]
});

// Attach command memory database structures
client.commands = new Collection();

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
  const files = fs.readdirSync(dirPath).filter(file => file.endsWith(".js"));

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    try {
      // Clear require cache to enable hot reloading support if required
      delete require.cache[require.resolve(filePath)];
      const command = require(filePath);

      // Validate signature: Must contain 'data' schema and 'execute' handler
      if (command && typeof command === "object" && command.data && typeof command.execute === "function") {
        client.commands.set(command.data.name, command);
        client.logger.info(`Loaded ${namespace} Command: /${command.data.name} (from ${file})`);
      } else {
        client.logger.warn(`Skipped invalid command structure at: ${file} (Missing 'data' or 'execute' function)`);
      }
    } catch (error) {
      client.logger.error(`Failed to load command at ${file} in ${namespace} context:`, { error: error.message });
    }
  }
}

// Execute defensive command file bootloaders
loadCommandsFromDirectory(CORE_DIR, "Core");
loadCommandsFromDirectory(ADDONS_DIR, "Addon");

// 4. Register the clientReady Lifecycle Hook to synchronize slash commands
// NOTE: discord.js v14+ renamed 'ready' to 'clientReady' to distinguish it
// from the raw Gateway READY packet. Using 'ready' still works but prints a
// DeprecationWarning; 'clientReady' is the correct modern event name.
client.once("clientReady", async () => {
  client.logger.info(`Successfully logged in as ${client.user.tag}! Synchronizing application command registries...`);

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

// 5. Build integrated slash commands router and event router
client.on("interactionCreate", async (interaction) => {
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
      content: `${Emojis.global.error} **System Error:** An error occurred while executing this command. Please try again later or contact support.`,
      flags: MessageFlags.Ephemeral
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(errorPayload).catch(() => null);
    } else {
      await interaction.reply(errorPayload).catch(() => null);
    }
  }
});

// 6. Connect to Discord Gateway
if (process.env.DISCORD_TOKEN) {
  client.login(process.env.DISCORD_TOKEN).catch(err => {
    console.error("[Cortex HQ Partnership] Authentication failed while logging into Discord Gateway:", err.message);
  });
} else {
  console.warn("[Cortex HQ Partnership] Warning: DISCORD_TOKEN is missing from environment. Bot cannot log in.");
}
