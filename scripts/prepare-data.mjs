import fs from 'node:fs';
import assert from 'node:assert/strict';
const input = '/Users/gurmanothi/Documents/Codex/Workspace/fantasy-football/research/sleeper-10-team-classified-2026-10-01.json';
const pool = JSON.parse(fs.readFileSync(input, 'utf8'));
const keys = ['1389704453954736128:3:2', '1402727529042718720:3:1', '1402102379922354176:3:5', '1389708072447901696:3:3', '1402102379922354176:3:3'];
const rounds = keys.map((key, index) => {
  const m = pool.matchups.find(m => m.key === key);
  assert(m?.mvp_review_candidate, `Invalid selection ${key}`);
  const ordered = index % 2 === 0 ? [m.loser, m.winner] : [m.winner, m.loser];
  return { key, season: 2026, week: m.week, leagueId: m.league_id, scoring: m.scoring_settings,
    teams: ordered.map(t => ({ total: t.points, players: t.starters_named })),
    source: `https://api.sleeper.app/v1/league/${m.league_id}/matchups/${m.week}` };
});
fs.writeFileSync(new URL('../dist/data.js', import.meta.url), `window.ROUND_PACK = ${JSON.stringify({id:'prototype-01', rounds}, null, 2)};\n`);
console.log(`Prepared ${rounds.length} real matchups, season 2026, week 3.`);
