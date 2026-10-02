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
if(pool.legacyRoundKeys) {
  const legacy={...pool,rounds:rounds.filter(r=>pool.legacyRoundKeys.includes(r.key))};
  assert.equal(JSON.stringify(daily),JSON.stringify(ctx.window.GamePacks.makePack(legacy,{date:'2026-10-01'})));
  assert.equal(pool.legacyRoundKeys.length,72);
  assert(rounds.length>pool.legacyRoundKeys.length);
  assert(rounds.every(r=>r.week>=1&&r.week<=3));
  assert(rounds.filter(r=>r.resultClass==='close_winner').length>13);
}
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
const endless=ctx.window.GamePacks.endlessRound;
for(const seed of ['run-1','run-2','run-3']) {
  let previous=null;
  for(let cycle=0;cycle<4;cycle++) {
    const keys=[];
    for(let i=0;i<rounds.length;i++) {
      const index=cycle*rounds.length+i;
      const r=endless(pool,seed,index);
      assert.equal(JSON.stringify(r),JSON.stringify(endless(pool,seed,index)));
      assert.notEqual(r.key,previous);
      keys.push(r.key);previous=r.key;
    }
    assert.equal(new Set(keys).size,rounds.length);
  }
}
assert.notEqual(endless(pool,'run-1',0).key,endless(pool,'run-2',0).key);
assert.throws(()=>endless(pool,'run-1',-1));
assert.throws(()=>endless(pool,'run-1',1.5));
for(let i=0;i<30;i++) {
  const date=new Date(Date.UTC(2026,9,2+i)).toISOString().slice(0,10);
  const pack=make({date});
  assert.equal(new Set(pack.rounds.map(r=>r.key)).size,5);
  assert.equal(pack.rounds.filter(r=>r.resultClass==='close_winner').length,2);
  assert.equal(pack.rounds.filter(r=>r.resultClass==='competitive_win').length,2);
  assert.equal(pack.rounds.filter(r=>r.resultClass==='comfortable_win').length,1);
  assert.equal(JSON.stringify(pack),JSON.stringify(make({date,savedKeys:pack.rounds.map(r=>r.key)})));
}
const sparse={...pool,rounds:rounds.filter(r=>r.resultClass==='blowout').slice(0,5)};
assert.equal(ctx.window.GamePacks.makePack(sparse,{date:'2026-10-02'}).rounds.length,5);
vm.runInNewContext(fs.readFileSync(new URL('../dist/streaks.js',import.meta.url),'utf8'),ctx);
const stats=(dates,today)=>JSON.parse(JSON.stringify(ctx.window.DailyStreaks.stats(dates,today)));
assert.deepEqual(stats([],'2026-10-01'),{current:0,best:0,completed:0,dates:[]});
assert.equal(stats(['2026-09-29','2026-09-30'],'2026-10-01').current,2);
assert.equal(stats(['2026-09-29','2026-09-30','2026-10-01'],'2026-10-01').current,3);
assert.equal(stats(['2026-09-29','2026-09-30'],'2026-10-02').current,0);
assert.equal(stats(['2026-09-29','2026-09-30','2026-10-02'],'2026-10-02').best,2);
assert.deepEqual(stats(['bad','2026-02-30','2026-10-01','2026-10-01','2026-10-02'],'2026-10-01'),{current:1,best:1,completed:1,dates:['2026-10-01']});
assert.equal(stats(['2024-02-28','2024-02-29','2024-03-01'],'2024-03-01').current,3);
assert.equal(stats(['2025-12-31','2026-01-01'],'2026-01-01').current,2);
assert.throws(()=>stats([],'invalid'));
const head=fs.readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
assert(head.includes('<title>Sunday Split | Wordle for fantasy football</title>'));
for(const tag of ['og:title','og:description','og:image','og:url','twitter:card','twitter:image']) assert(head.includes(tag));
const png=fs.readFileSync(new URL('../dist/og.png',import.meta.url));
assert.equal(png.readUInt32BE(16),1200);
assert.equal(png.readUInt32BE(20),630);
const schema=JSON.parse(head.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
assert.equal(schema.name,'Sunday Split');
assert.equal(schema.url,'https://www.sundaysplit.app/');
assert.equal(schema.applicationCategory,'GameApplication');
assert(head.includes('<h1>Sunday Split</h1>'));
assert(head.includes('index,follow,max-image-preview:large'));
const robots=fs.readFileSync(new URL('../dist/robots.txt',import.meta.url),'utf8');
assert(robots.includes('Allow: /'));
assert(robots.includes('Sitemap: https://www.sundaysplit.app/sitemap.xml'));
const sitemap=fs.readFileSync(new URL('../dist/sitemap.xml',import.meta.url),'utf8');
assert.equal((sitemap.match(/<loc>/g)||[]).length,1);
assert(sitemap.includes('<loc>https://www.sundaysplit.app/</loc>'));
const gtm=head.match(/<!-- Google Tag Manager -->\s*<script>([\s\S]*?)<\/script>/)[1];
const injected=[];
const anchor={parentNode:{insertBefore:script=>injected.push(script)}};
const tags={window:{},document:{getElementsByTagName:()=>[anchor],createElement:()=>({})}};
vm.runInNewContext(gtm,tags);
assert.equal(injected.length,1);
assert.equal(injected[0].src,'https://www.googletagmanager.com/gtm.js?id=GTM-5BHGN67L');
assert.equal(injected[0].async,true);
assert.equal(tags.window.dataLayer[0].event,'gtm.js');
assert.equal(typeof tags.window.dataLayer[0]['gtm.start'],'number');
assert(head.includes('https://www.googletagmanager.com/ns.html?id=GTM-5BHGN67L'));
console.log(`${rounds.length} real matchups validated; pack weighting, saved selections, endless cycles, daily streaks, and social metadata passed.`);
