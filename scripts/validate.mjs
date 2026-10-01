import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const ctx = {window:{}};
vm.runInNewContext(fs.readFileSync(new URL('../dist/data.js', import.meta.url),'utf8'), ctx);
const {rounds} = ctx.window.ROUND_PACK;
assert.equal(rounds.length, 5);
assert.equal(new Set(rounds.map(r=>r.key)).size,5);
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
console.log('Five unique rounds; paired slots, names, scores, and totals validated.');
