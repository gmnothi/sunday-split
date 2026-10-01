import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const ctx = {window:{}};
vm.runInNewContext(fs.readFileSync(new URL('../dist/data.js', import.meta.url),'utf8'), ctx);
const pool = ctx.window.MATCHUP_POOL;
const {rounds} = pool;
assert(rounds.length >= 50);
assert.equal(new Set(rounds.map(r=>r.key)).size,rounds.length);
for (const r of rounds) {
  assert.equal(r.season,2026);
  assert.equal(r.teams.length,2);
  assert.notEqual(r.teams[0].total,r.teams[1].total);
  assert.deepEqual(r.teams[0].players.map(p=>p.slot),r.teams[1].players.map(p=>p.slot));
  for (const t of r.teams) {
    assert(Math.abs(t.players.reduce((n,p)=>n+p.points,0)-t.total)<0.01);
    assert(t.players.every(p=>p.name && p.player_id && Number.isFinite(p.points)));
  }
}
vm.runInNewContext(fs.readFileSync(new URL('../dist/packs.js', import.meta.url),'utf8'), ctx);
const make = options=>ctx.window.GamePacks.makePack(pool,options);
const daily=make({date:'2026-10-01'});
assert.equal(daily.rounds.length,5);
assert.equal(new Set(daily.rounds.map(r=>r.key)).size,5);
assert.equal(JSON.stringify(daily),JSON.stringify(make({date:'2026-10-01'})));
assert.notEqual(JSON.stringify(daily.rounds),JSON.stringify(make({date:'2026-10-02'}).rounds));
const classes=new Set(daily.rounds.map(r=>r.resultClass));
assert.equal(classes.size,4);
const excluded=daily.rounds.map(r=>r.key);
const practice=make({date:'2026-10-01',practiceSeed:'practice-1',excluded});
assert(practice.rounds.every(r=>!excluded.includes(r.key)));
const restored=make({date:'2026-10-02',practiceSeed:'practice-1',savedKeys:practice.rounds.map(r=>r.key)});
assert.equal(JSON.stringify(restored.rounds),JSON.stringify(practice.rounds));
const depleted=make({date:'2026-10-01',practiceSeed:'exhausted',excluded:rounds.map(r=>r.key)});
assert.equal(depleted.rounds.length,5);
assert.equal(new Set(depleted.rounds.map(r=>r.key)).size,5);
console.log(`${rounds.length} real matchups validated; daily determinism, variety, practice exclusions, and restore checks passed.`);
