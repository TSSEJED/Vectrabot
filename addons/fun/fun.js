/**
 * @file addons/fun/fun.js
 * @description Suite of SFW fun commands and mini-games.
 * Uses Discord Components V2 for rich interaction.
 *
 * © 2026 Cortex HQ & bot-hosting.net
 */

const { SlashCommandBuilder, MessageFlags } = require("discord.js");
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
    const accentColor = botConfig.embedColor ? parseInt(botConfig.embedColor, 16) : 0x3b82f6;

    if (subcommand === "8ball") {
      const responses = [
        "It is certain.", "It is decidedly so.", "Without a doubt.", "Yes definitely.",
        "You may rely on it.", "As I see it, yes.", "Most likely.", "Outlook good.",
        "Yes.", "Signs point to yes.", "Reply hazy, try again.", "Ask again later.",
        "Better not tell you now.", "Cannot predict now.", "Concentrate and ask again.",
        "Don't count on it.", "My reply is no.", "My sources say no.",
        "Outlook not so good.", "Very doubtful.", "Absolutely.", "The stars align for yes.",
        "Indubitably.", "Count on it.", "Highly probable.", "All signs point to yes.",
        "You can bet on it.", "Without a shred of doubt.", "The universe says yes.",
        "Most assuredly.", "Chances are high.", "It is written in the stars.",
        "Signs are favorable.", "Positively yes.", "The path is clear.",
        "The answer is a resounding yes.", "Everything points to success.",
        "Expect it soon.", "Undeniably so.", "The outlook is bright.",
        "Ask a different way.", "The fog has not lifted yet.", "Cannot say for sure.",
        "The energy is unclear.", "Check back in a bit.", "The signs are blurry.",
        "Hard to say right now.", "The cosmos are undecided.", "The future is shifting.",
        "Wait and see.", "Try asking tomorrow.", "The answer is obscured.",
        "Not a chance.", "Highly unlikely.", "No way.", "Don't hold your breath.",
        "The signs point to no.", "My instincts say no.", "Absolutely not.",
        "The stars say no.", "Doubtful, very doubtful.", "Unlikely to happen.",
        "The outlook is grim.", "Not in this lifetime.", "Prospects are poor.",
        "The answers point away from yes.", "Do not expect it.", "Negative.",
        "The chance is near zero.", "Forget about it.", "It is not meant to be.",
        "The winds have changed against it.", "Do not count on a positive outcome.",
        "The current is pulling away from yes.", "All paths lead to no.",
        "Signs are heavily pointing to no.", "The final answer is no."
      ];

      const result = responses[Math.floor(Math.random() * responses.length)];
      const question = interaction.options.getString("question");

      return interaction.reply({
        flags: 1 << 15,
        components: [{
          type: 17,
          accent_color: accentColor,
          components: [
            { type: 10, content: `# 🎱 Magic 8-Ball` },
            { type: 14 },
            { type: 10, content: `**Question:** ${question}\n**Answer:** ${result}` }
          ]
        }]
      });
    }

    if (subcommand === "coinflip") {
      const isHeads = Math.random() < 0.5;
      const result = isHeads ? "Heads" : "Tails";
      const icon = isHeads ? "🟡" : "🥈";

      return interaction.reply({
        flags: 1 << 15,
        components: [{
          type: 17,
          accent_color: accentColor,
          components: [
            { type: 10, content: `# 🪙 Coin Flip` },
            { type: 14 },
            { type: 10, content: `${Emojis.resolve(client, "satellite", guildId)} The coin spun in the air and landed on: **${result}** ${icon}` }
          ]
        }]
      });
    }

    if (subcommand === "roll") {
      const sides = interaction.options.getInteger("sides") || 6;
      if (sides < 2) return interaction.reply({ content: "Dice must have at least 2 sides.", flags: MessageFlags.Ephemeral });
      const result = Math.floor(Math.random() * sides) + 1;

      return interaction.reply({
        flags: 1 << 15,
        components: [{
          type: 17,
          accent_color: accentColor,
          components: [
            { type: 10, content: `# 🎲 Dice Roll` },
            { type: 14 },
            { type: 10, content: `${Emojis.resolve(client, "satellite", guildId)} You rolled a **D${sides}** and got: \`${result}\`` }
          ]
        }]
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
        "Why can't Elsa have a balloon? Because she will let it go!",
        "Why did the math book look sad? Because it had too many problems!",
        "What do you call a sleeping dinosaur? A dino-snore!",
        "What do you call a factory that makes okay products? A satisfactory!",
        "Why don't skeletons fight each other? They don't have the guts!",
        "What do you call an alligator in a vest? An investigator!",
        "How do you organize a space party? You planet!",
        "Why did the computer go to the doctor? It had a virus!",
        "What do you call a pile of kittens? A meowntain!",
        "Why did the tomato turn red? Because it saw the salad dressing!",
        "What do you call a magician dog? A Labracadabrador!",
        "Why are regular chicken coops so small? Because if they were bigger, they'd be chicken sedans!",
        "What do you call a belt made out of watches? A waist of time!",
        "Why did the golfer bring two pairs of pants? In case he got a hole in one!",
        "What do you call a pig that does karate? A pork chop!",
        "Why do we tell actors to 'break a leg'? Because every play has a cast!",
        "How does the moon cut his hair? Eclipse it!",
        "What kind of shoes do ninjas wear? Sneakers!",
        "Why did the stadium get hot after the game? All of the fans left!",
        "What do you call a dynamic duo of monkeys? Prime mates!",
        "Why did the picture go to jail? Because it was framed!",
        "What do you call a fish wearing a bowtie? Sofishticated!",
        "Why can't your nose be 12 inches long? Because then it would be a foot!",
        "What do you call a dog that can do magic tricks? A wizard retriever!",
        "Why did the cookie go to the hospital? Because it was feeling crummy!",
        "What do you call a bee that can’t make up its mind? A maybee!",
        "Why do seagulls fly over the ocean? Because if they flew over the bay, they’d be bagels!",
        "What do you call a tree that fits in your hand? A palm tree!",
        "Why did the robber take a bath? Because he wanted to make a clean getaway!",
        "What do you call a short psychic running from the law? A small medium at large!",
        "Why don't some couples go to the gym? Because some relationships don't work out!",
        "What do you call an empty jar of cheese dip? Nacho problem!",
        "Why did the banana go to the doctor? It wasn't peeling well!",
        "What do you call a line of men waiting to get haircuts? A barbecue!",
        "Why did the skeleton go to the party? To have some body to talk to!",
        "What do you call a deer with no eyes? No idea!",
        "Why did the clock get kicked out of the library? It tocked too much!",
        "What do you call a fake stone in Ireland? A sham rock!",
        "Why do birds fly south for the winter? Because it's too far to walk!",
        "What do you call a sad coffee? A despresso!",
        "Why did the crab never share? Because he was shellfish!",
        "What do you call a shoe made out of a banana? A slipper!",
        "Why did the man fall down the well? Because he couldn't see that well!",
        "What do you call a dinosaur that crashes his car? Tyrannosaurus Wrecks!",
        "Why did the helper sleep under the car? Because he wanted to wake up oily!",
        "What do you call a snowman with a tan? A puddle!",
        "Why did the coffee file a police report? It got mugged!",
        "What do you call a pencil with two erasers? Pointless!",
        "Why did the physics teacher break up with the biology teacher? There was no chemistry!",
        "What do you call a monkey that loves potato chips? A chipmunk!",
        "Why did the student eat his homework? Because the teacher told him it was a piece of cake!",
        "What do you call a cow during an earthquake? A milkshake!",
        "Why did the gym close down? It just didn't work out!",
        "What do you call a sensitive volcano? Magma-nanimous!",
        "Why did the phone wear glasses? It lost its contacts!",
        "What do you call a horse that lives next door? A neighbor!",
        "Why did the boy bring a ladder to school? He wanted to go to high school!",
        "What do you call an duck that gets straight A's? A wise quacker!",
        "Why did the ocean break up with the shore? It was tide down!",
        "What do you call a running toilet? An emergency!",
        "Why did the music teacher need a ladder? To reach the high notes!",
        "What do you call a group of unorganized cats? A meowndain of chaos!",
        "Why did the leaf go to the doctor? It was green around the gills!",
        "What do you call a detective who solves cases in the snow? Sherlock Ohms!",
        "Why did the belt get arrested? For holding up a pair of pants!",
        "What do you call a dog that can tell time? A watch dog!"
      ];

      const joke = jokes[Math.floor(Math.random() * jokes.length)];

      return interaction.reply({
        flags: 1 << 15,
        components: [{
          type: 17,
          accent_color: accentColor,
          components: [
            { type: 10, content: `# 😂 Random Joke` },
            { type: 14 },
            { type: 10, content: `${Emojis.resolve(client, "support", guildId)} **The Bot says:** ${joke}` }
          ]
        }]
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
        "Cowboys didn't actually wear cowboy hats until the late 1800s.",
        "The Eiffel Tower can be 15 cm taller during the summer due to thermal expansion.",
        "Sea otters hold hands when they sleep to keep from drifting apart.",
        "The heart of a shrimp is located in its head.",
        "Some turtles can breathe through their butts.",
        "A snail can sleep for up to three years.",
        "Sloths can hold their breath longer than dolphins.",
        "The fingerprints of koalas are so indistinguishable from humans that they have on occasion been confused at crime scenes.",
        "A day on Venus is longer than a year on Venus.",
        "Sharks have been around longer than trees.",
        "Cats have 32 muscles in each ear.",
        "A blue whale's tongue weighs as much as an entire elephant.",
        "The voices of all characters in the original 'Peanuts' specials were children, not adults.",
        "Butterflies taste with their feet.",
        "Oxford University is older than the Aztec Empire.",
        "The total weight of all ants on Earth is likely similar to the total weight of all humans.",
        "An adult human body has 206 bones, but a baby is born with about 300.",
        "A cloud can weigh more than a million pounds.",
        "The longest wedding veil was longer than 63 football fields.",
        "There are more trees on Earth than stars in the Milky Way galaxy.",
        "The Earth's crust is divided into several massive plates that drift across the mantle.",
        "Human teeth are the only part of the body that cannot heal themselves.",
        "A lightning strike is five times hotter than the surface of the sun.",
        "The average person will spend six months of their life waiting for red lights to turn green.",
        "Banging your head against a wall for an hour burns 150 calories.",
        "Pigs can't look up into the sky.",
        "A rat can last longer without water than a camel.",
        "Your stomach acid is strong enough to dissolve razor blades.",
        "The fear of long words is called hippopotomonstrosesquippedaliophobia.",
        "Most lipstick contains fish scales.",
        "Like fingerprints, everyone's tongue print is different.",
        "An ostrich's eye is bigger than its brain.",
        "A crocodile cannot stick its tongue out.",
        "The world's smallest mammal is the bumblebee bat.",
        "Rabbits cannot vomit.",
        "Polar bear skin is black.",
        "The giant squid has eyes the size of dinner plates.",
        "A group of crows is called a murder.",
        "The letter 'J' is the only letter not appearing in the periodic table.",
        "A liter of water weighs exactly one kilogram at sea level.",
        "Sound travels about four times faster in water than in air.",
        "The moon has 'moonquakes' that occur due to the gravitational pull of the Earth.",
        "Ants do not have lungs; they breathe through tiny holes in their sides.",
        "All clocks in the movie 'Pulp Fiction' are set to 4:20.",
        "The first product to have a barcode was Wrigley's gum.",
        "A day on Mars is called a Sol.",
        "The tongue is the strongest muscle in the human body relative to its size.",
        "The world's oldest known recipe is for beer.",
        "The moon is moving away from Earth at a rate of 3.8 cm per year.",
        "There is a town in Norway called Hell, and it freezes over regularly.",
        "Dragonflies have six legs but cannot walk.",
        "The dot over the letter 'i' or 'j' is called a tittle.",
        "The longest recorded flight of a chicken is 13 seconds.",
        "Most cars in Japan are white, silver, or black.",
        "The national animal of Scotland is the unicorn.",
        "The average human produces enough saliva in a lifetime to fill two swimming pools.",
        "Sharks do not have a single bone in their bodies.",
        "The Eiffel Tower was originally intended for Barcelona.",
        "A bolt of lightning contains enough energy to toast 100,000 slices of bread.",
        "The coldest temperature ever recorded was -89.2°C in Antarctica.",
        "Cats spend about 70% of their lives sleeping.",
        "The first email was sent by Ray Tomlinson in 1971.",
        "The Great Wall of China is not visible from space with the naked eye."
      ];

      const fact = facts[Math.floor(Math.random() * facts.length)];

      return interaction.reply({
        flags: 1 << 15,
        components: [{
          type: 17,
          accent_color: accentColor,
          components: [
            { type: 10, content: `# 💡 Random Fact` },
            { type: 14 },
            { type: 10, content: `${Emojis.resolve(client, "info", guildId)} **Did you know?** ${fact}` }
          ]
        }]
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

      return interaction.reply({
        flags: 1 << 15,
        components: [{
          type: 17,
          accent_color: accentColor,
          components: [
            { type: 10, content: `# 🪨 Rock Paper Scissors` },
            { type: 14 },
            { type: 10, content: `**Your Move:** ${emotes[userChoice]} ${userChoice.toUpperCase()}\n**My Move:** ${emotes[botChoice]} ${botChoice.toUpperCase()}\n**Result:** **${result}**` }
          ]
        }]
      });
    }
  }
};
