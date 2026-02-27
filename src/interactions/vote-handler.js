const fs = require("fs");
const path = require("path");

const matchesPath = path.join(__dirname, "..", "data", "matches.json");

function loadMatches() {
    try {
        const data = fs.readFileSync(matchesPath, "utf8");
        return JSON.parse(data);
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

module.exports = async function handleVote(interaction) {
    const customId = interaction.customId; // e.g. vote_3_team1

    if (!customId.startsWith("vote_")) return;

    const parts = customId.split("_"); // ["vote", "3", "team1"]
    const matchId = parseInt(parts[1]);
    const vote = parts[2]; // "team1" | "draw" | "team2"

    const userId = interaction.user.id;

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

    if (match.votes[userId]) {
        return interaction.reply({
            content: "You already voted in this match.",
            ephemeral: true,
        });
    }

    if (!match.allowDraw && vote === "draw") {
        return interaction.reply({
            content: "This match does not allow draws.",
            ephemeral: true,
        });
    }

    match.votes[userId] = vote;
    saveMatches(matches);

    return interaction.reply({
        content: `Your vote for **${vote}** has been registered.`,
        ephemeral: true,
    });
};
