import express, { Request, Response } from "express";
import sqlite3 from "sqlite3";
import path from "path";
import cors from "cors";

const app = express();
app.use(express.json());

app.use(cors({ origin: "http://localhost:5173" }));

const dbPath = path.join(__dirname, "wadsongs.db");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error("DB open error:", err.message);
  else console.log("Connected to DB:", dbPath);
});

app.get("/", (req: Request, res: Response) => {
  res.send("API running. Try /hometown/Oasis or /debug/artists");
});

// DEBUG: show artists table columns
app.get("/debug/artists", (req: Request, res: Response) => {
  db.all("PRAGMA table_info(artists)", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// EX 3: get hometown by artist name
app.get("/hometown/:artist", (req: Request, res: Response) => {
  const artist = req.params.artist;

  db.get(
    "SELECT hometown, lat, lon FROM artists WHERE name = ?",
    [artist],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: "Artist not found" });

      // return lng for frontend
      const result = {
        hometown: (row as any).hometown,
        lat: (row as any).lat,
        lng: (row as any).lon
      };

      res.json(result);
    }
  );
});

// ✅ EX 4: add a new hometown (POST)
app.post("/hometown", (req: Request, res: Response) => {
  const { name, hometown, lat, lon } = req.body;

  // validation: must all exist and be correct types
  if (
    typeof name !== "string" || name.trim() === "" ||
    typeof hometown !== "string" || hometown.trim() === "" ||
    typeof lat !== "number" ||
    typeof lon !== "number"
  ) {
    return res.status(400).json({
      error: "Missing/invalid fields. Required: name (string), hometown (string), lat (number), lon (number)"
    });
  }

  db.run(
    "INSERT INTO artists (name, lat, lon, hometown) VALUES (?, ?, ?, ?)",
    [name.trim(), lat, lon, hometown.trim()],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });

      // Spec says only add marker if 200 returned, so return 200
      res.status(200).json({
        message: "Hometown added",
        id: this.lastID,
        name: name.trim(),
        hometown: hometown.trim(),
        lat,
        lon
      });
    }
  );
});

app.listen(3000, () => {
  console.log("Express API running at http://localhost:3000");
  console.log("Try: http://localhost:3000/hometown/Oasis");
});
