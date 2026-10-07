import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const ctx={window:{}};
for(const file of ['data.js','data-2025.js','curation.js','packs.js'])vm.runInNewContext(fs.readFileSync(new URL('../dist/'+file,import.meta.url),'utf8'),ctx);
const {makePack}=ctx.window.GamePacks;
function overlap(rounds) {
  const seen=new Set();let count=0;
  for(const r of rounds)for(const key of new Set(r.teams.flatMap(t=>t.players.map(p=>`${r.season}:${r.week}:${p.player_id}`)))) {
    if(seen.has(key))count++;seen.add(key);
  }
  return count;
}
for(const f of JSON.parse(fs.readFileSync(new URL('./fixtures/daily-before-diversity.json',import.meta.url),'utf8'))) {
  assert.equal(JSON.stringify(makePack(f.season===2025?ctx.window.MATCHUP_POOL_2025:ctx.window.MATCHUP_POOL,f.options)),JSON.stringify(f.pack),'Today changed');
}
for(const pool of [ctx.window.MATCHUP_POOL,ctx.window.MATCHUP_POOL_2025]) {
  let featured=0,close=0;
  for(let n=0;n<100;n++)for(const mode of ['daily','practice','confidence']) {
    const date=new Date(Date.UTC(2026,9,8+n)).toISOString().slice(0,10);
    const options={date,...(mode==='practice'?{practiceSeed:'diversity-'+n}:mode==='confidence'?{practiceSeed:'confidence-'+n,freezeDaily:true}:{})};
    const pack=makePack(pool,options);
    assert.equal(pack.rounds.length,5);
    assert.equal(new Set(pack.rounds.map(r=>r.key)).size,5);
    assert.equal(overlap(pack.rounds),0,`${pool.rounds[0].season}/${mode}/${date}: answer leak`);
    const weeks=new Set(pack.rounds.map(r=>r.week));
    assert(weeks.size>=Math.min(4,new Set(pool.rounds.map(r=>r.week)).size),'Insufficient week variety');
    assert.equal(JSON.stringify(pack),JSON.stringify(makePack(pool,options)),'Not deterministic');
    assert.equal(JSON.stringify(pack),JSON.stringify(makePack(pool,{...options,savedKeys:pack.rounds.map(r=>r.key)})),'Saved pack changed');
    featured+=pack.rounds.filter(r=>ctx.window.MATCHUP_CURATION.seasons[r.season]?.[r.key]).length;
    close+=pack.rounds.filter(r=>['close_winner','competitive_win'].includes(r.resultClass)).length;
  }
  const previous=makePack(pool,{date:'2026-10-08',practiceSeed:'seen'});
  const fresh=makePack(pool,{date:'2026-10-08',practiceSeed:'next',excluded:previous.rounds.map(r=>r.key)});
  assert(fresh.rounds.every(r=>!previous.rounds.some(p=>p.key===r.key)),'Seen exclusion ignored');
  const depleted=makePack(pool,{date:'2026-10-08',practiceSeed:'depleted',excluded:pool.rounds.map(r=>r.key)});
  assert.equal(depleted.rounds.length,5);assert.equal(overlap(depleted.rounds),0);
  console.log(`${pool.rounds[0].season}: 300 five-round packs without repeated player-week performances; ${(featured/1500*100).toFixed(1)}% featured, ${(close/1500*100).toFixed(1)}% close/competitive.`);
}
// Same player across different weeks/seasons is safe; roster-side duplication counts once.
const round=(key,week,ids,season=2026)=>({key,week,season,resultClass:'close_winner',teams:[{total:10,players:ids.map(player_id=>({player_id}))},{total:9,players:[{player_id:ids[0]}]}]});
const synthetic={version:'fixture',rounds:[round('one',1,['QB','DEF','K']),round('two',2,['QB','DEF','K']),round('three',3,['QB','DEF','K']),round('four',4,['QB','DEF','K']),round('five',1,['QB','DEF','K'],2025)]};
assert.equal(overlap(makePack(synthetic,{date:'2026-10-08'}).rounds),0);
const sparse={version:'small',rounds:Array.from({length:5},(_,i)=>round('shared-'+i,1,['shared','DEF-'+i,'K-'+i]))};
const fallback=makePack(sparse,{date:'2026-10-08'});
assert.equal(fallback.rounds.length,5);assert.equal(overlap(fallback.rounds),4);
assert.equal(JSON.stringify(fallback),JSON.stringify(makePack(sparse,{date:'2026-10-08'})));
const oldKeys=sparse.rounds.map(r=>r.key);
assert.deepEqual(Array.from(makePack(sparse,{date:'2026-10-08',savedKeys:oldKeys}).rounds,r=>r.key),oldKeys);
console.log('Sparse fallback, defense/kicker identity, cross-week/season identity and restoration passed.');
