import React, { useState } from "react";

const endpoints = [
  {
    category: "Teams",
    routes: [
      {
        method: "GET",
        path: "/teams",
        desc: "Get all teams.",
      },
      {
        method: "GET",
        path: "/teams/:teamId",
        desc: "Get a specific team by ID.",
        example: "/teams/1",
      },
      {
        method: "GET",
        path: "/teams/:teamId/summary",
        desc: "Get summary stats for a team.",
        example: "/teams/1/summary",
      },
    ],
  },
  {
    category: "Players",
    routes: [
      {
        method: "GET",
        path: "/teams/:teamId/players",
        desc: "Get all players for a team.",
        example: "/teams/1/players",
      },
      {
        method: "GET",
        path: "/players",
        desc: "Get all players.",
      },
      {
        method: "GET",
        path: "/players/:playerId/stats",
        desc: "Get all stats for a player.",
        example: "/players/15/stats",
      },
    ],
  },
  {
    category: "Matches",
    routes: [
      {
        method: "GET",
        path: "/teams/:teamId/matches",
        desc: "Get all matches for a team.",
        example: "/teams/1/matches",
      },
      {
        method: "GET",
        path: "/matches/:matchId/events",
        desc: "Get events for a match.",
        example: "/matches/12/events",
      },
      {
        method: "GET",
        path: "/matches/:matchId/stats",
        desc: "Get all stats for a specific match.",
        example: "/matches/12/stats",
      },
    ],
  },
];

export default function ApiDocs() {
  const [expanded, setExpanded] = useState(null);

  return (
    <main className="container">
      <header>
        <h1 className="page-title">⚽ Sport Stats API Docs</h1>
        <p className="subtitle">Interactive documentation for your Express + Supabase API.</p>
        <p className="base-url">Base URL: <code>/</code></p>
      </header>

      {endpoints.map((group, i) => (
        <section key={group.category}>
          <h2 className="section-title">{group.category}</h2>
          <div>
            {group.routes.map((r, j) => {
              const id = `${i}-${j}`;
              const isOpen = expanded === id;
              const methodClass = "get";
              return (
                <div key={id} className="card">
                  <button
                    className="card-toggle"
                    onClick={() => setExpanded(isOpen ? null : id)}
                  >
                    <div>
                      <span className={`method ${methodClass}`}>{r.method}</span>
                      <code>{r.path}</code>
                      <p className="desc">{r.desc}</p>
                    </div>
                    <span className="chevron">{isOpen ? "▲" : "▼"}</span>
                  </button>

                  {isOpen && (
                    <div className="card-body">
                      {r.example && (
                        <p className="desc">
                          Example URL: <code>{r.example}</code>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {/* interactive try-out removed */}

      <footer className="footer">
        © 2025 Sport Stats API — Interactive Docs built with React + CSS
      </footer>
    </main>
  );
}
