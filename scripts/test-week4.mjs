import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const ctx={window:{}};
for(const file of ['data.js','data-2025.js','curation.js','packs.js','clues-2026.js','clues.js'])vm.runInNewContext(fs.readFileSync(new URL('../dist/'+file,import.meta.url),'utf8'),ctx);
const pool=ctx.window.MATCHUP_POOL;
const week4=pool.rounds.filter(r=>r.week===4);
assert(week4.length>50,'Insufficient Week 4 matchups');
for(const fixture of JSON.parse(fs.readFileSync(new URL('./fixtures/daily-before-week4.json',import.meta.url),'utf8'))) {
  const selected=ctx.window.GamePacks.makePack(fixture.season===2026?pool:ctx.window.MATCHUP_POOL_2025,fixture.options);
  assert.equal(JSON.stringify(selected.rounds.map(r=>({key:r.key,totals:r.teams.map(t=>t.total)}))),JSON.stringify(fixture.rounds),'Existing daily or confidence selection changed');
}
let appearances=0;
for(const r of week4)for(const p of r.teams.flatMap(t=>t.players)) {
  const clue=ctx.window.PlayerClues.player(r,p.player_id);
  assert(clue,'Missing Week 4 clues');
  assert(clue.games.every(g=>g.season<2026||g.week<4),'Lookahead in recent form');
  appearances++;
}
let future=0;
for(let i=0;i<60;i++) {
  const date=new Date(Date.UTC(2026,9,7+i)).toISOString().slice(0,10);
  future+=ctx.window.GamePacks.makePack(pool,{date}).rounds.filter(r=>r.week===4).length;
}
assert(future>0,'Week 4 absent from future daily games');
console.log(`${week4.length} Week 4 matchups, ${appearances} player clues; prior daily/confidence sets unchanged and future daily inclusion verified.`);
