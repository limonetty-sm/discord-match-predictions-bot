require("dotenv").config();
const { REST, Routes } = require("discord.js");
const fs = require("fs");
const path = require("path");

const commands = [];
const commandsPath = path.join(__dirname, "src", "commands");
const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);

    if ("data" in command && "execute" in command) {
        commands.push(command.data.toJSON());
    } else {
        console.warn(
            '[WARNING] The command at ${filePath} is missing "data" or "execute".',
        );
    }
}

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log(
            "Refreshing ${commands.length} application (/) commands...",
        );

        await rest.put(
            Routes.applicationGuildCommands(
                process.env.CLIENT_ID,
                process.env.GUILD_ID,
            ),
            { body: commands },
        );

        console.log("Commands registered successfully.");
    } catch (error) {
        console.error(error);
    }
})();
