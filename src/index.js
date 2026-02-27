require("dotenv").config();
const { Client, GatewayIntentBits, Collection } = require("discord.js");
const fs = require("fs");
const path = require("path");

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

client.commands = new Collection();

// Load commands
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);

    if ("data" in command && "execute" in command) {
        client.commands.set(command.data.name, command);
    } else {
        console.warn(
            `[WARNING] The command at ${filePath} is missing "data" or "execute".`,
        );
    }
}

// Load button handler
const handleVote = require("./interactions/vote-handler");

// Handle interactions
client.on("interactionCreate", async (interaction) => {
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            await interaction.reply({
                content: "There was an error executing this command.",
                ephemeral: true,
            });
        }
    }

    if (interaction.isButton()) {
        try {
            await handleVote(interaction);
        } catch (error) {
            console.error(error);
        }
    }
});

// Ready
client.once("ready", () => {
    console.log(`Bot logged in as ${client.user.tag}`);
});

// Login
client.login(process.env.DISCORD_TOKEN);
