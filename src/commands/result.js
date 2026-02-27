const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder,
} = require("discord.js");
const fs = require("fs");
const path = require("path");

const matchesPath = path.join(__dirname, "..", "data", "matches.json");
const leaderboardPath = path.join(__dirname, "..", "data", "leaderboard.json");
const { addLog } = require("../utils/logger");

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
        .setName("result")
        .setDescription(
            "Closes a match and assigns points to correct predictions.",
        )
        .addIntegerOption((option) =>
            option.setName("id").setDescription("Match ID").setRequired(true),
        )
        .addStringOption((option) =>
            option
                .setName("winner")
                .setDescription("Winning option")
                .setRequired(true)
                .addChoices(
                    { name: "Team 1", value: "team1" },
                    { name: "Draw", value: "draw" },
                    { name: "Team 2", value: "team2" },
                ),
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const matchId = interaction.options.getInteger("id");
        const team1 = interaction.options.getString("team1");
        const team2 = interaction.options.getString("team2");
        const winner = interaction.options.getString("winner");

        const matches = loadMatches();
        const match = matches.find((m) => m.id === matchId);

        if (!match) {
            return interaction.reply({
                content: "Match not found.",
                ephemeral: true,
            });
        }

        if (match.closed) {
            return interaction.reply({
                content: "This match is already closed.",
                ephemeral: true,
            });
        }

        if (!match.allowDraw && winner === "draw") {
            return interaction.reply({
                content: "This match does not allow draws.",
                ephemeral: true,
            });
        }

        match.closed = true;
        match.winner = winner;
        saveMatches(matches);

        const leaderboard = loadLeaderboard();
        let correctUsers = [];

        for (const [userId, vote] of Object.entries(match.votes)) {
            if (vote === winner) {
                leaderboard[userId] = (leaderboard[userId] || 0) + 1;
                correctUsers.push(userId);
            }
        }

        saveLeaderboard(leaderboard);

        addLog({
            action: "result",
            matchId,
            winner,
            admin: interaction.user.id,
        });

        const winnerText =
            winner === "team1"
                ? match.team1
                : winner === "team2"
                  ? match.team2
                  : "Draw";

        const embed = new EmbedBuilder()
            .setTitle(`Match Result ${match.team1} vs. ${match.team2}`)
            .setColor("#00cc66")
            .addFields({
                name: "Winner",
                value: `**${winnerText}**`,
                inline: false,
            });

        if (correctUsers.length > 0) {
            embed.addFields({
                name: "Correct predictions:",
                value: correctUsers.map((id) => `<@${id}>`).join(", "),
            });
        } else {
            embed.addFields({
                name: "Correct predictions:",
                value: "No one predicted correctly.",
            });
        }

        return interaction.reply({ embeds: [embed] });
    },
};
