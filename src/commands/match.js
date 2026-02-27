const {
    SlashCommandBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
} = require("discord.js");
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

module.exports = {
    data: new SlashCommandBuilder()
        .setName("match")
        .setDescription("Creates a new match with voting buttons.")
        .addStringOption((option) =>
            option
                .setName("team1")
                .setDescription("First team")
                .setRequired(true),
        )
        .addStringOption((option) =>
            option
                .setName("team2")
                .setDescription("Second team")
                .setRequired(true),
        )
        .addBooleanOption((option) =>
            option
                .setName("allow_draw")
                .setDescription("Whether the match allows a draw")
                .setRequired(true),
        ),

    async execute(interaction) {
        const team1 = interaction.options.getString("team1");
        const team2 = interaction.options.getString("team2");
        const allowDraw = interaction.options.getBoolean("allow_draw");

        const matches = loadMatches();
        const matchId = matches.length + 1;

        const newMatch = {
            id: matchId,
            team1,
            team2,
            allowDraw,
            votes: {},
            closed: false,
            winner: null,
        };

        matches.push(newMatch);
        saveMatches(matches);

        // --- EMBED BONITO ---
        const embed = new EmbedBuilder()
            .setTitle(`${team1} vs. ${team2}`)
            .setDescription("Make your prediction by pressing a button.")
            .setColor("#0099ff")
            .setFooter({ text: `Match ID #${matchId}` });

        // --- BOTONES DINÁMICOS ---
        const row = new ActionRowBuilder();

        row.addComponents(
            new ButtonBuilder()
                .setCustomId(`vote_${matchId}_team1`)
                .setLabel(team1)
                .setStyle(ButtonStyle.Primary),
        );

        if (allowDraw) {
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId(`vote_${matchId}_draw`)
                    .setLabel("Draw")
                    .setStyle(ButtonStyle.Secondary),
            );
        }

        row.addComponents(
            new ButtonBuilder()
                .setCustomId(`vote_${matchId}_team2`)
                .setLabel(team2)
                .setStyle(ButtonStyle.Primary),
        );

        await interaction.reply({
            embeds: [embed],
            components: [row],
        });
    },
};
