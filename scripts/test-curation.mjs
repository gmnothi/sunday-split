import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const ctx={window:{}};
for(const file of ['data.js','data-2025.js','packs.js'])vm.runInNewContext(fs.readFileSync(new URL('../dist/'+file,import.meta.url),'utf8'),ctx);
const pools=[ctx.window.MATCHUP_POOL,ctx.window.MATCHUP_POOL_2025];
const before=pools.map(pool=>JSON.stringify(ctx.window.GamePacks.makePack(pool,{date:'2026-10-02'})));
vm.runInNewContext(fs.readFileSync(new URL('../dist/curation.js',import.meta.url),'utf8'),ctx);
const curation=ctx.window.MATCHUP_CURATION;
for(const [i,pool] of pools.entries()) {
  assert.equal(JSON.stringify(ctx.window.GamePacks.makePack(pool,{date:'2026-10-02'})),before[i],'Today changed');
  const features=curation.seasons[pool.rounds[0].season];
  assert(Object.keys(features).length>100);
  assert(Object.keys(features).every(key=>pool.rounds.some(r=>r.key===key)));
  for(let day=0;day<60;day++) {
    const date=new Date(Date.UTC(2026,9,3+day)).toISOString().slice(0,10);
    const pack=ctx.window.GamePacks.makePack(pool,{date});
    assert.equal(new Set(pack.rounds.map(r=>r.key)).size,5);
    assert(pack.rounds.filter(r=>features[r.key]).length>=3,'Missing featured rounds');
    assert.equal(JSON.stringify(pack),JSON.stringify(ctx.window.GamePacks.makePack(pool,{date,savedKeys:pack.rounds.map(r=>r.key)})));
  }
  let featured=0;
  for(let seed=0;seed<100;seed++)for(let index=0;index<20;index++) {
    const r=ctx.window.GamePacks.endlessRound(pool,'curation-'+seed,index);
    if(features[r.key])featured++;
  }
  const rate=featured/2000;
  assert(rate>.45&&rate<.8,'Bad endless feature frequency: '+rate);
  for(let cycle=0;cycle<2;cycle++) {
    const keys=pool.rounds.map((_,index)=>ctx.window.GamePacks.endlessRound(pool,'unique',cycle*pool.rounds.length+index).key);
    assert.equal(new Set(keys).size,pool.rounds.length,'Endless repeats within cycle');
    if(cycle)assert.notEqual(keys[0],ctx.window.GamePacks.endlessRound(pool,'unique',cycle*pool.rounds.length-1).key);
  }
  const excluded=Object.keys(features);
  const fallback=ctx.window.GamePacks.makePack(pool,{date:'2026-10-03',practiceSeed:'exclude-featured',excluded});
  assert(fallback.rounds.every(r=>!features[r.key]),'Seen exclusion ignored');
  console.log(`${pool.rounds[0].season}: ${Object.keys(features).length} featured, ${(rate*100).toFixed(1)}% of early endless rounds; daily stability, saved packs, exclusions and full-cycle uniqueness passed.`);
}
