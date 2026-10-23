import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {lastCompletedWeek,nextDailyDate} from './refresh-policy.mjs';

assert.equal(lastCompletedWeek({season_type:'regular',week:6}),5);
assert.equal(lastCompletedWeek({season_type:'regular',week:7}),6);
assert.equal(lastCompletedWeek({season_type:'regular',week:1}),0);
assert.equal(lastCompletedWeek({season_type:'regular',week:18}),17);
assert.equal(lastCompletedWeek({season_type:'post',week:1}),18);
assert.equal(lastCompletedWeek({season_type:'pre',week:3}),0);
assert.throws(()=>lastCompletedWeek({season_type:'regular',week:0}));
assert.throws(()=>lastCompletedWeek({season_type:'unknown',week:6}));
assert.equal(nextDailyDate(new Date('2026-10-17T02:00:00Z')),'2026-10-17');
assert.equal(nextDailyDate(new Date('2026-10-17T05:00:00Z')),'2026-10-18');
assert.equal(nextDailyDate(new Date('2026-12-31T18:00:00Z')),'2027-01-01');

const ctx={window:{}};
for(const file of ['data.js','data-2025.js','curation.js','packs.js','clues-2026.js','clues.js'])vm.runInNewContext(fs.readFileSync(new URL('../dist/'+file,import.meta.url),'utf8'),ctx);
const fixture=JSON.parse(fs.readFileSync(new URL('./fixtures/daily-before-week5.json',import.meta.url),'utf8'));
const pool=ctx.window.MATCHUP_POOL;
for(const {season,options,pack} of fixture.selections) {
  assert.equal(JSON.stringify(ctx.window.GamePacks.makePack(season===2026?pool:ctx.window.MATCHUP_POOL_2025,options)),JSON.stringify(pack),'Previously published daily changed');
  assert.equal(JSON.stringify(ctx.window.GamePacks.makePack(season===2026?pool:ctx.window.MATCHUP_POOL_2025,{...options,savedKeys:pack.rounds.map(r=>r.key)})),JSON.stringify(pack),'Saved pack changed');
}
for(const [key,hash] of Object.entries(fixture.hashes)) {
  const round=pool.rounds.find(r=>r.key===key);
  assert(round,'Historical matchup removed');
  assert.equal(createHash('sha256').update(JSON.stringify(round)).digest('hex'),hash,'Historical matchup changed');
}
const report=JSON.parse(fs.readFileSync(new URL('../research/pool-refresh-2026-report.json',import.meta.url),'utf8'));
assert(pool.rounds.every(r=>r.week<=report.state.lastCompletedWeek),'Live week imported');
const added=pool.rounds.filter(r=>!fixture.hashes[r.key]);
assert(added.length>50,'Expected a substantial completed-week import');
assert(added.every(r=>r.week>=5&&r.week<=report.state.lastCompletedWeek),'Unexpected week in this refresh');
for(const r of added)for(const p of r.teams.flatMap(t=>t.players)) {
  const clue=ctx.window.PlayerClues.player(r,p.player_id);
  assert(clue,'Missing new player context');
  assert(clue.games.every(g=>g.season<r.season||g.week<r.week),'Recent form leaks the answer');
}
let included=0;
for(let day=17;day<47;day++) {
  const date=new Date(Date.UTC(2026,9,day)).toISOString().slice(0,10);
  included+=ctx.window.GamePacks.makePack(pool,{date}).rounds.filter(r=>r.week===report.state.lastCompletedWeek).length;
}
assert(included>0,'New week never reaches Daily');
console.log(`${added.length} completed-week matchups added; prior rounds, 36 daily/confidence packs, saved games, context and future inclusion verified.`);
