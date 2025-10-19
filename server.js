// Load environment variables from .env file
import "dotenv/config";

import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";

const app = express();
app.use(cors());
app.use(express.json());

// Supabase setup
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn("Missing SUPABASE_URL/SUPABASE_ANON_KEY env vars.");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- Routes ---
app.get("/", (req, res) => {
  res.redirect("/docs");
});

// Health check
app.get("/health", (_req, res) => res.json({ ok: true }));

// Serve React-powered docs from public/docs
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const docsDir = path.join(__dirname, "public", "docs");
app.use("/docs", express.static(docsDir));
app.get(["/docs", "/docs/*"], (_req, res) => {
  res.sendFile(path.join(docsDir, "index.html"));
});

// Get basic team info
app.get("/teams/:teamId", async (req, res) => {
  const { teamId } = req.params;
  const { data, error } = await supabase
    .from("teams")
    .select("*")
    .eq("id", teamId)
    .maybeSingle();
  if (error) return res.status(500).json({ error: "Failed to fetch team" });
  if (!data) return res.status(404).json({ error: "Team not found" });
  res.json(data);
});

// (Mutations removed: only GET endpoints are exposed)

// Get players for a team
app.get("/teams/:teamId/players", async (req, res) => {
  const { teamId } = req.params;
  const { data, error } = await supabase
    .from("players")
    .select("id, name, position, jersey_num, image_url")
    .eq("team_id", teamId)
    .order("name");
  if (error) return res.status(500).json({ error: "Failed to fetch players" });
  res.json(data);
});

// (Player create/update/delete removed)

// Get matches
app.get("/teams/:teamId/matches", async (req, res) => {
  const { teamId } = req.params;
  const { data, error } = await supabase
    .from("matches")
    .select("*")
    .eq("team_id", teamId)
    .order("date", { ascending: false });
  if (error) return res.status(500).json({ error: "Failed to fetch matches" });
  res.json(data);
});

// (Match creation removed)


// Get all teams
app.get("/teams", async (req, res) => {
  const { data, error } = await supabase
    .from("teams")
    .select("*")
    .order("name", { ascending: true }); // optional sorting by name

  if (error) return res.status(500).json({ error: "Failed to fetch teams" });
  res.json(data);
});


// (Match update/delete removed)

// Get match events
app.get("/matches/:matchId/events", async (req, res) => {
  const { matchId } = req.params;
  const { data, error } = await supabase
    .from("match_events")
    .select("*")
    .eq("match_id", matchId)
    .order("minute");
  if (error) return res.status(500).json({ error: "Failed to fetch events" });
  res.json(data);
});

// (Match event create/delete removed)

// Team summary stats
app.get("/teams/:teamId/summary", async (req, res) => {
  const { teamId } = req.params;
  const { data, error } = await supabase
    .from("matches")
    .select(
      "team_score, opponent_score, shots, shots_on_target, possession, corners, fouls, offsides, xg, passes, pass_accuracy, tackles, saves"
    )
    .eq("team_id", teamId);
  if (error) return res.status(500).json({ error: "Failed to fetch summary" });
  const summary = (data || []).reduce((acc, m) => {
    const add = (k, v) => (acc[k] = (acc[k] || 0) + (Number(v) || 0));
    add("goals_for", m.team_score);
    add("goals_against", m.opponent_score);
    add("shots", m.shots);
    add("shots_on_target", m.shots_on_target);
    add("corners", m.corners);
    add("fouls", m.fouls);
    add("offsides", m.offsides);
    add("xg", m.xg);
    add("passes", m.passes);
    add("tackles", m.tackles);
    add("saves", m.saves);
    if (m.possession != null) {
      acc._posessionEntries = (acc._posessionEntries || 0) + 1;
      acc._posessionSum = (acc._posessionSum || 0) + Number(m.possession);
    }
    if (m.pass_accuracy != null) {
      acc._paEntries = (acc._paEntries || 0) + 1;
      acc._paSum = (acc._paSum || 0) + Number(m.pass_accuracy);
    }
    return acc;
  }, {});
  if (summary._posessionEntries)
    summary.possession_avg = Math.round(
      summary._posessionSum / summary._posessionEntries
    );
  if (summary._paEntries)
    summary.pass_accuracy_avg = Math.round(summary._paSum / summary._paEntries);
  delete summary._posessionEntries;
  delete summary._posessionSum;
  delete summary._paEntries;
  delete summary._paSum;
  res.json(summary);
});
// --- Player Stats API ---

// Get all stats for a player
app.get("/players/:playerId/stats", async (req, res) => {
    const { playerId } = req.params;
    const { data, error } = await supabase
        .from("player_stats")
        .select("*")
        .eq("player_id", playerId)
        .order("created_at", { ascending: false });

    if (error) return res.status(500).json({ error: "Failed to fetch player stats" });
    res.json(data);
});

app.get("/players", async (req, res) => {
  const { data, error } = await supabase
    .from("players")
    .select("*")
    .order("name", { ascending: true }); // optional sorting by name

  if (error) return res.status(500).json({ error: "Failed to fetch playes" });
  res.json(data);
});

// Get all stats for a specific match
app.get("/matches/:matchId/stats", async (req, res) => {
    const { matchId } = req.params;
    const { data, error } = await supabase
        .from("player_stats")
        .select("*")
        .eq("match_id", matchId)
        .order("created_at", { ascending: false });

    if (error) return res.status(500).json({ error: "Failed to fetch match stats" });
    res.json(data);
});










// Start server
const port = process.env.PORT || 4000;
if (process.env.NODE_ENV !== "test") {
  app.listen(port, () => {
    console.log(` API listening at http://localhost:${port}`);
  });
}

export default app;
