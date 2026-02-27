const { addLog } = require("../utils/logger");
const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const fs = require("fs");
const path = require("path");

const matchesPath = path.join(__dirname, "..", "data", "matches.json");
const leaderboardPath = path.join(__dirname, "..", "data", "leaderboard.json");

function loadMatches() {
    try {
        return JSON.parse(fs.readFileSync(matchesPath, "utf8"));
    } catch (err) {
        console.error("Error loading matches:", err);
        return [];
    }
}

function saveMatches(matches) {
    try {
        fs.writeFileSync(matchesPath, JSON.stringify(matches, null, 2));
    } catch (err) {
        console.error("Error saving matches:", err);
    }
}

function loadLeaderboard() {
    try {
        return JSON.parse(fs.readFileSync(leaderboardPath, "utf8"));
    } catch (err) {
        console.error("Error loading leaderboard:", err);
        return {};
    }
}

function saveLeaderboard(board) {
    try {
        fs.writeFileSync(leaderboardPath, JSON.stringify(board, null, 2));
    } catch (err) {
        console.error("Error saving leaderboard:", err);
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("undoresult")
        .setDescription(
            "Reverts the result of a match and removes awarded points.",
        )
        .addIntegerOption((option) =>
            option.setName("id").setDescription("Match ID").setRequired(true),
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const matchId = interaction.options.getInteger("id");

        const matches = loadMatches();
        const match = matches.find((m) => m.id === matchId);

        if (!match) {
            return interaction.reply({
                content: "Match not found.",
                ephemeral: true,
            });
        }

        if (!match.closed) {
            return interaction.reply({
                content: "This match is not closed, nothing to undo.",
                ephemeral: true,
            });
        }

        const leaderboard = loadLeaderboard();

        // Determine the winner that was previously set
        // We infer it by checking which users got points
        // But since we don't store the winner, we must deduce it:
        // The winner is the vote that appears among users who gained points.
        // However, this is ambiguous if multiple users voted differently.
        // So we store the winner explicitly in the match object.

        if (!match.winner) {
            return interaction.reply({
                content:
                    "This match has no stored winner. Undo is not possible unless winner tracking is added.",
                ephemeral: true,
            });
        }

        const winner = match.winner;

        // Remove points from users who voted correctly
        let affectedUsers = [];

        for (const [userId, vote] of Object.entries(match.votes)) {
            if (vote === winner) {
                if (leaderboard[userId] && leaderboard[userId] > 0) {
                    leaderboard[userId] -= 1;
                }
                affectedUsers.push(userId);
            }
        }

        // Reopen the match
        match.closed = false;
        delete match.winner; // remove stored winner

        saveMatches(matches);
        saveLeaderboard(leaderboard);
        addLog({
            action: "undoresult",
            matchId,
            admin: interaction.user.id,
        });

        const summary =
            affectedUsers.length > 0
                ? `Points removed from: ${affectedUsers.map((id) => `<@${id}>`).join(", ")}`
                : "No users had points to remove.";

        return interaction.reply({
            content: `Result for match **#${matchId}** has been reverted.\n${summary}`,
        });
    },
};
