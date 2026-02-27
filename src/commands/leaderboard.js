const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

const leaderboardPath = path.join(__dirname, "..", "data", "leaderboard.json");

function loadLeaderboard() {
    try {
        return JSON.parse(fs.readFileSync(leaderboardPath, "utf8"));
    } catch (err) {
        console.error("Error loading leaderboard:", err);
        return {};
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("leaderboard")
        .setDescription("Shows the current ranking."),

    async execute(interaction) {
        const leaderboard = loadLeaderboard();

        const entries = Object.entries(leaderboard);

        if (entries.length === 0) {
            return interaction.reply("There are no points yet.");
        }

        // Sort by points descending
        entries.sort((a, b) => b[1] - a[1]);

        let text = "**🏆 Leaderboard**\n\n";

        let position = 1;
        for (const [userId, points] of entries) {
            text += `${position}. <@${userId}> — **${points}** point${points !== 1 ? "s" : ""}\n`;
            position++;
        }

        return interaction.reply(text);
    },
};
