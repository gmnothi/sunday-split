import fs from 'node:fs';
import assert from 'node:assert/strict';
const input = '/Users/gurmanothi/Documents/Codex/Workspace/fantasy-football/research/sleeper-10-team-classified-2026-10-01.json';
const pool = JSON.parse(fs.readFileSync(input, 'utf8'));
const rounds = pool.matchups.filter(m=>m.mvp_review_candidate).sort((a,b)=>a.key.localeCompare(b.key)).map(m => {
  assert(m.quality_flags.length === 0, `Invalid selection ${m.key}`);
  const ordered = [m.winner, m.loser];
  return { key:m.key, season: 2026, week: m.week, leagueId: m.league_id, scoring: m.scoring_settings, resultClass:m.result_class,
    teams: ordered.map(t => ({ total: t.points, players: t.starters_named })),
    source: `https://api.sleeper.app/v1/league/${m.league_id}/matchups/${m.week}` };
});
fs.writeFileSync(new URL('../dist/data.js', import.meta.url), `window.MATCHUP_POOL = ${JSON.stringify({version:'2026-weeks-1-3-v1', rounds}, null, 2)};\n`);
console.log(`Prepared ${rounds.length} real matchups from 2026 weeks 1-3.`);
