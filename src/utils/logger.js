const fs = require("fs");
const path = require("path");

const logsPath = path.join(__dirname, "..", "data", "logs.json");

function loadLogs() {
    try {
        return JSON.parse(fs.readFileSync(logsPath, "utf8"));
    } catch (err) {
        console.error("Error loading logs:", err);
        return [];
    }
}

function saveLogs(logs) {
    try {
        fs.writeFileSync(logsPath, JSON.stringify(logs, null, 2));
    } catch (err) {
        console.error("Error saving logs:", err);
    }
}

function addLog(entry) {
    const logs = loadLogs();

    logs.push({
        timestamp: new Date().toISOString(),
        ...entry,
    });

    saveLogs(logs);
}

module.exports = { addLog };
