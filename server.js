// Load environment variables from .env file
import "dotenv/config";

import express from "express";
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
  res.send("Sport Stats API is running!");
});

// Health check
app.get("/health", (_req, res) => res.json({ ok: true }));

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

// Create team
app.post("/teams", async (req, res) => {
  const { id, name, coach_id, logo_url } = req.body || {};
  if (!id || !name)
    return res.status(400).json({ error: "id and name are required" });
  const { data, error } = await supabase
    .from("teams")
    .insert({
      id,
      name,
      coach_id: coach_id || null,
      logo_url: logo_url || null,
    })
    .select()
    .single();
  if (error) return res.status(500).json({ error: "Failed to create team" });
  res.status(201).json(data);
});

// Update team
app.put("/teams/:teamId", async (req, res) => {
  const { teamId } = req.params;
  const { name, coach_id, logo_url } = req.body || {};
  const { data, error } = await supabase
    .from("teams")
    .update({ name, coach_id, logo_url })
    .eq("id", teamId)
    .select()
    .single();
  if (error) return res.status(500).json({ error: "Failed to update team" });
  res.json(data);
});

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

// Create player
app.post("/teams/:teamId/players", async (req, res) => {
  const { teamId } = req.params;
  const { name, position, jersey_num, image_url } = req.body || {};
  if (!name) return res.status(400).json({ error: "name is required" });
  const { data, error } = await supabase
    .from("players")
    .insert({
      team_id: teamId,
      name,
      position: position || null,
      jersey_num: jersey_num || null,
      image_url: image_url || null,
    })
    .select()
    .single();
  if (error) return res.status(500).json({ error: "Failed to create player" });
  res.status(201).json(data);
});

// Update player
app.put("/players/:playerId", async (req, res) => {
  const { playerId } = req.params;
  const { name, position, jersey_num, image_url } = req.body || {};
  const { data, error } = await supabase
    .from("players")
    .update({ name, position, jersey_num, image_url })
    .eq("id", playerId)
    .select()
    .single();
  if (error) return res.status(500).json({ error: "Failed to update player" });
  res.json(data);
});

// Delete player
app.delete("/players/:playerId", async (req, res) => {
  const { playerId } = req.params;
  const { error } = await supabase.from("players").delete().eq("id", playerId);
  if (error) return res.status(500).json({ error: "Failed to delete player" });
  res.status(204).send();
});

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

// Create match
app.post("/teams/:teamId/matches", async (req, res) => {
  const { teamId } = req.params;
  const {
    opponent_name,
    team_score = 0,
    opponent_score = 0,
    date,
    status = "scheduled",
    ...stats
  } = req.body || {};
  if (!opponent_name || !date)
    return res
      .status(400)
      .json({ error: "opponent_name and date are required" });
  const payload = {
    team_id: teamId,
    opponent_name,
    team_score,
    opponent_score,
    date,
    status,
    ...stats,
  };
  const { data, error } = await supabase
    .from("matches")
    .insert(payload)
    .select()
    .single();
  if (error) return res.status(500).json({ error: "Failed to create match" });
  res.status(201).json(data);
});

// Update match
app.put("/matches/:matchId", async (req, res) => {
  const { matchId } = req.params;
  const allowed = [
    "opponent_name",
    "team_score",
    "opponent_score",
    "date",
    "status",
    "possession",
    "shots",
    "shots_on_target",
    "corners",
    "fouls",
    "offsides",
    "xg",
    "passes",
    "pass_accuracy",
    "tackles",
    "saves",
  ];
  const body = req.body || {};
  const update = Object.fromEntries(
    Object.entries(body).filter(([k]) => allowed.includes(k))
  );
  const { data, error } = await supabase
    .from("matches")
    .update(update)
    .eq("id", matchId)
    .select()
    .single();
  if (error) return res.status(500).json({ error: "Failed to update match" });
  res.json(data);
});

// Delete match
app.delete("/matches/:matchId", async (req, res) => {
  const { matchId } = req.params;
  const { error } = await supabase.from("matches").delete().eq("id", matchId);
  if (error) return res.status(500).json({ error: "Failed to delete match" });
  res.status(204).send();
});

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

// Create match event
app.post("/matches/:matchId/events", async (req, res) => {
  const { matchId } = req.params;
  const { player_id, event_type, minute } = req.body || {};
  if (!player_id || !event_type)
    return res
      .status(400)
      .json({ error: "player_id and event_type are required" });
  const { data, error } = await supabase
    .from("match_events")
    .insert({
      match_id: matchId,
      player_id,
      event_type,
      minute: minute ?? null,
    })
    .select()
    .single();
  if (error) return res.status(500).json({ error: "Failed to create event" });
  res.status(201).json(data);
});

// Delete match event
app.delete("/events/:eventId", async (req, res) => {
  const { eventId } = req.params;
  const { error } = await supabase
    .from("match_events")
    .delete()
    .eq("id", eventId);
  if (error) return res.status(500).json({ error: "Failed to delete event" });
  res.status(204).send();
});

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

// Start server
const port = process.env.PORT || 4000;
if (process.env.NODE_ENV !== "test") {
  app.listen(port, () => {
    console.log(`API listening at http://localhost:${port}`);
  });
}

export default app;
