/**
 * @file addons/fun/fun.js
 * @description Suite of SFW fun commands and mini-games.
 * Uses Discord Components V2 for rich interaction.
 *
 * © 2026 Cortex HQ & bot-hosting.net
 */

const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require("discord.js");
const Emojis = require("../../config/emojis");
const storage = require("../../utils/storage");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("fun")
    .setDescription("Base command for all entertainment modules.")
    .addSubcommand(sub =>
      sub.setName("8ball")
        .setDescription("Ask the magic 8-ball a question.")
        .addStringOption(opt => opt.setName("question").setDescription("What do you want to know?").setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName("coinflip")
        .setDescription("Flip a virtual coin.")
    )
    .addSubcommand(sub =>
      sub.setName("roll")
        .setDescription("Roll a polyhedral die.")
        .addIntegerOption(opt => opt.setName("sides").setDescription("Number of sides (default 6).").setRequired(false))
    )
    .addSubcommand(sub =>
      sub.setName("joke")
        .setDescription("Get a random SFW joke.")
    )
    .addSubcommand(sub =>
      sub.setName("fact")
        .setDescription("Get a random interesting fact.")
    )
    .addSubcommand(sub =>
      sub.setName("rps")
        .setDescription("Play Rock Paper Scissors against the bot.")
        .addStringOption(opt =>
          opt.setName("choice")
            .setDescription("Your move.")
            .setRequired(true)
            .addChoices(
              { name: "Rock 🪨", value: "rock" },
              { name: "Paper 📄", value: "paper" },
              { name: "Scissors ✂️", value: "scissors" }
            )
        )
    ),

  /**
   * Execute the fun command suite.
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   * @param {import('discord.js').Client} client
   */
  async execute(interaction, client) {
    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guildId;
    const botConfig = storage.get("bot_identity", guildId) || {};
    const embedColor = botConfig.embedColor ? parseInt(botConfig.embedColor, 16) : 0x3b82f6;

    if (subcommand === "8ball") {
      const responses = [
        "It is certain.", "It is decidedly so.", "Without a doubt.", "Yes definitely.",
        "You may rely on it.", "As I see it, yes.", "Most likely.", "Outlook good.",
        "Yes.", "Signs point to yes.", "Reply hazy, try again.", "Ask again later.",
        "Better not tell you now.", "Cannot predict now.", "Concentrate and ask again.",
        "Don't count on it.", "My reply is no.", "My sources say no.",
        "Outlook not so good.", "Very doubtful."
      ];
      const result = responses[Math.floor(Math.random() * responses.length)];
      const question = interaction.options.getString("question");

      const embed = new EmbedBuilder()
        .setColor(embedColor)
        .setTitle(`🎱 Magic 8-Ball`)
        .addFields(
          { name: "Question", value: question },
          { name: "Answer", value: result }
        )
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }

    if (subcommand === "coinflip") {
      const isHeads = Math.random() < 0.5;
      const result = isHeads ? "Heads" : "Tails";
      const icon = isHeads ? "🟡" : "🥈";

      return interaction.reply({
        content: `${Emojis.resolve(client, "satellite", guildId)} The coin spun in the air and landed on: **${result}** ${icon}`
      });
    }

    if (subcommand === "roll") {
      const sides = interaction.options.getInteger("sides") || 6;
      if (sides < 2) return interaction.reply({ content: "Dice must have at least 2 sides.", flags: MessageFlags.Ephemeral });
      const result = Math.floor(Math.random() * sides) + 1;

      return interaction.reply({
        content: `${Emojis.resolve(client, "satellite", guildId)} You rolled a **D${sides}** and got: \`${result}\` 🎲`
      });
    }

    if (subcommand === "joke") {
      const jokes = [
        "Why don't scientists trust atoms? Because they make up everything!",
        "What do you call a fake noodle? An impasta!",
        "Why did the scarecrow win an award? Because he was outstanding in his field!",
        "How does a penguin build its house? Igloos it together!",
        "What do you call cheese that isn't yours? Nacho cheese!",
        "Why did the bicycle fall over? Because it was two-tired!",
        "What do you call a bear with no teeth? A gummy bear!",
        "Why can't Elsa have a balloon? Because she will let it go!"
      ];
      const joke = jokes[Math.floor(Math.random() * jokes.length)];

      return interaction.reply({
        content: `${Emojis.resolve(client, "support", guildId)} **Random Joke:** ${joke}`
      });
    }

    if (subcommand === "fact") {
      const facts = [
        "A group of flamingos is called a 'flamboyance'.",
        "Honey never spoils. Archaeologists have found edible honey in ancient Egyptian tombs.",
        "Octopuses have three hearts and blue blood.",
        "Bananas are berries, but strawberries aren't.",
        "The shortest war in history lasted only 38 minutes.",
        "Wombat poop is cube-shaped.",
        "A single strand of spaghetti is called a 'spaghetto'.",
        "Cowboys didn't actually wear cowboy hats until the late 1800s."
      ];
      const fact = facts[Math.floor(Math.random() * facts.length)];

      return interaction.reply({
        content: `${Emojis.resolve(client, "info", guildId)} **Did you know?** ${fact}`
      });
    }

    if (subcommand === "rps") {
      const userChoice = interaction.options.getString("choice");
      const botChoices = ["rock", "paper", "scissors"];
      const botChoice = botChoices[Math.floor(Math.random() * botChoices.length)];

      const emotes = { rock: "🪨", paper: "📄", scissors: "✂️" };

      let result;
      if (userChoice === botChoice) {
        result = "It's a draw! 🤝";
      } else if (
        (userChoice === "rock" && botChoice === "scissors") ||
        (userChoice === "paper" && botChoice === "rock") ||
        (userChoice === "scissors" && botChoice === "paper")
      ) {
        result = "You win! 🎉";
      } else {
        result = "I win! 🤖";
      }

      const embed = new EmbedBuilder()
        .setColor(embedColor)
        .setTitle("Rock Paper Scissors")
        .addFields(
          { name: "Your Move", value: `${emotes[userChoice]} ${userChoice.toUpperCase()}`, inline: true },
          { name: "My Move", value: `${emotes[botChoice]} ${botChoice.toUpperCase()}`, inline: true },
          { name: "Result", value: `**${result}**` }
        )
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }
  }
};
