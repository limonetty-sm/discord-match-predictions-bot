const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

const matchesPath = path.join(__dirname, "..", "data", "matches.json");

function loadMatches() {
    try {
        return JSON.parse(fs.readFileSync(matchesPath, "utf8"));
    } catch (err) {
        console.error("Error loading matches:", err);
        return [];
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("matches")
        .setDescription("Shows the list of open matches.")
        .addBooleanOption((option) =>
            option
                .setName("show_closed")
                .setDescription("Include closed matches")
                .setRequired(false),
        ),

    async execute(interaction) {
        const showClosed =
            interaction.options.getBoolean("show_closed") || false;

        const matches = loadMatches();

        const filtered = showClosed
            ? matches
            : matches.filter((m) => !m.closed);

        if (filtered.length === 0) {
            return interaction.reply(
                showClosed
                    ? "There are no matches yet."
                    : "There are no open matches.",
            );
        }

        let text = showClosed
            ? "**📋 All Matches**\n\n"
            : "**📋 Open Matches**\n\n";

        for (const match of filtered) {
            text += `**#${match.id}**\n`;
            text += `${match.team1} vs. ${match.team2}\n`;
            text += `Status: **${match.closed ? "Closed" : "Open"}**\n\n`;
        }

        return interaction.reply(text);
    },
};
