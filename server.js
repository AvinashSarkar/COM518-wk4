"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const sqlite3_1 = __importDefault(require("sqlite3"));
const path_1 = __importDefault(require("path"));
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)({ origin: "http://localhost:5173" }));
const dbPath = path_1.default.join(__dirname, "wadsongs.db");
const db = new sqlite3_1.default.Database(dbPath, (err) => {
    if (err)
        console.error("DB open error:", err.message);
    else
        console.log("Connected to DB:", dbPath);
});
// DEBUG: show artists table columns
app.get("/debug/artists", (req, res) => {
    db.all("PRAGMA table_info(artists)", [], (err, rows) => {
        if (err)
            return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});
// EX 3: get hometown by artist name
app.get("/hometown/:artist", (req, res) => {
    const artist = req.params.artist;
    db.get("SELECT hometown, lat, lon FROM artists WHERE name = ?", [artist], (err, row) => {
        if (err)
            return res.status(500).json({ error: err.message });
        if (!row)
            return res.status(404).json({ error: "Artist not found" });
        // return lng for frontend
        const result = {
            hometown: row.hometown,
            lat: row.lat,
            lng: row.lon
        };
        res.json(result);
    });
});
// ✅ EX 4: add a new hometown (POST)
app.post("/hometown", (req, res) => {
    const { name, hometown, lat, lon } = req.body;
    // validation: must all exist and be correct types
    if (typeof name !== "string" || name.trim() === "" ||
        typeof hometown !== "string" || hometown.trim() === "" ||
        typeof lat !== "number" ||
        typeof lon !== "number") {
        return res.status(400).json({
            error: "Missing/invalid fields. Required: name (string), hometown (string), lat (number), lon (number)"
        });
    }
    db.run("INSERT INTO artists (name, lat, lon, hometown) VALUES (?, ?, ?, ?)", [name.trim(), lat, lon, hometown.trim()], function (err) {
        if (err)
            return res.status(500).json({ error: err.message });
        // Spec says only add marker if 200 returned, so return 200
        res.status(200).json({
            message: "Hometown added",
            id: this.lastID,
            name: name.trim(),
            hometown: hometown.trim(),
            lat,
            lon
        });
    });
});
app.listen(3000, () => {
    console.log("Express API running at http://localhost:3000");
    console.log("Try: http://localhost:3000/hometown/Oasis");
});
