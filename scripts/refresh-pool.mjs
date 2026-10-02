import fs from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const sourcePath=process.argv[2]||new URL('./league-sources.json',import.meta.url);
const registry=JSON.parse(await fs.readFile(sourcePath,'utf8'));
const context={window:{}};
vm.runInNewContext(await fs.readFile(new URL('../dist/data.js',import.meta.url),'utf8'),context);
const original=context.window.MATCHUP_POOL;
const report={pages:[],invites:[],leagues:[],rejections:{},errors:[]};
const reject=reason=>report.rejections[reason]=(report.rejections[reason]||0)+1;
async function request(url,json=true) {
  await new Promise(resolve=>setTimeout(resolve,100));
  const response=await fetch(url,{signal:AbortSignal.timeout(20000)});
  if(!response.ok) throw new Error(`${url}: ${response.status}`);
  return json?response.json():response.text();
}
const api=path=>request(`https://api.sleeper.app/v1/${path}`);
const state=await api('state/nfl');
assert.equal(state.season,'2026');
const lastWeek=Math.min(3,state.week-1);
const ids=new Set(registry.league_ids);
for(const url of registry.draft_pages||[]) {
  try {
    const html=await request(url,false);
    const drafts=new Set([...html.matchAll(/href="\/draft\/([0-9]+)"/g)].map(m=>m[1]));
    for(const id of drafts) {
      const draft=await api(`draft/${id}`);
      if(draft?.league_id)ids.add(draft.league_id);
    }
    report.pages.push({url,status:'read',drafts:drafts.size});
  }catch(error){report.errors.push(error.message);}
}
const invites=new Map();
for(const entry of registry.invites||[])invites.set(entry.code,entry.source);
for(const url of process.argv.includes('--drafts-only')?[]:registry.discovery_pages) {
  try {
    const html=await request(url,false);
    for(const match of html.matchAll(/sleeper\.(?:com|app)\/i\/([A-Za-z0-9]+)/g)) invites.set(match[1],url);
    report.pages.push({url,status:'read'});
  } catch(error) {report.errors.push(error.message);}
}
for(const [code,source] of process.argv.includes('--drafts-only')?[]:[...invites].slice(0,240)) {
  try {
    const html=await request(`https://sleeper.com/i/${code}`,false);
    const id=html.match(/league_id[^0-9]{1,20}([0-9]{15,22})/)?.[1];
    if(id)ids.add(id);
    report.invites.push({code,source,league_id:id||null});
  } catch(error) {report.errors.push(error.message);}
}
const players=await api('players/nfl');
const playerName=id=>players[id]?.full_name||[players[id]?.first_name,players[id]?.last_name].filter(Boolean).join(' ');
console.log(`Checking ${ids.size} league IDs discovered from ${invites.size} public invites.`);
const rounds=new Map(original.rounds.map(r=>[r.key,r]));
for(const id of ids) {
  try {
    const league=await api(`league/${id}`);
    if(league.season!=='2026'||league.sport!=='nfl'||league.total_rosters!==10||league.status!=='in_season') {reject('not_active_2026_10_team');continue;}
    const slots=league.roster_positions.filter(s=>s!=='BN');
    const scoring=league.scoring_settings;
    if(slots.length>12||slots.filter(s=>s==='QB').length!==1||!slots.every(s=>['QB','RB','WR','TE','FLEX','K','DEF'].includes(s))||league.settings.best_ball===1||![0,.5,1].includes(scoring.rec??0)||Object.entries(scoring).some(([k,v])=>v!==0&&/bonus|first_down|rush_att|pass_att|rec_att/.test(k))) {reject('nonstandard_format');continue;}
    const item={league_id:id,teams:10,slots,accepted:0};
    for(let week=1;week<=lastWeek;week++) {
      if(Number(league.settings.last_scored_leg)<week)continue;
      const weekly=await api(`league/${id}/matchups/${week}`);
      if(!Array.isArray(weekly))continue;
      const pairs=new Map();
      for(const team of weekly)if(team.matchup_id!=null){const pair=pairs.get(team.matchup_id)||[];pair.push(team);pairs.set(team.matchup_id,pair);}
      for(const [matchupId,pair] of pairs) {
        if(pair.length!==2||pair.some(t=>t.custom_points!=null||!Array.isArray(t.starters)||t.starters.length!==slots.length||new Set(t.starters).size!==slots.length||t.starters.some(p=>!p||p==='0'||!playerName(p))||!Array.isArray(t.starters_points)||t.starters_points.length!==slots.length||!t.starters_points.every(Number.isFinite)||t.starters_points.filter(p=>p===0).length>=2||!Number.isFinite(t.points)||Math.abs(t.starters_points.reduce((a,b)=>a+b,0)-t.points)>=.01)) {reject('incomplete_adjusted_or_unmapped');continue;}
        if(pair[0].points===pair[1].points){reject('tie');continue;}
        const margin=Math.abs(pair[0].points-pair[1].points);
        const key=`${id}:${week}:${matchupId}`;
        const round={key,season:2026,week,leagueId:id,scoring,resultClass:margin<=5?'close_winner':margin<=15?'competitive_win':margin<30?'comfortable_win':'blowout',teams:[...pair].sort((a,b)=>b.points-a.points).map(t=>({total:t.points,players:t.starters.map((player_id,i)=>({player_id,name:playerName(player_id),slot:slots[i],points:t.starters_points[i]}))})),source:`https://api.sleeper.app/v1/league/${id}/matchups/${week}`};
        if(!rounds.has(key))rounds.set(key,round);
        item.accepted++;
      }
    }
    report.leagues.push(item);
  }catch(error){report.errors.push(error.message);}
}
const ordered=[...rounds.values()].sort((a,b)=>a.key.localeCompare(b.key));
const summary={previous:original.rounds.length,total:ordered.length,added:ordered.length-original.rounds.length,leagues:new Set(ordered.map(r=>r.leagueId)).size,distribution:Object.fromEntries(['close_winner','competitive_win','comfortable_win','blowout'].map(c=>[c,ordered.filter(r=>r.resultClass===c).length]))};
await fs.mkdir(new URL('../research/',import.meta.url),{recursive:true});
await fs.writeFile(new URL('../research/pool-refresh-report.json',import.meta.url),JSON.stringify({summary,...report},null,2)+'\n');
if(!summary.added){console.log(JSON.stringify(summary));process.exit(0);}
const revision=createHash('sha256').update(ordered.map(r=>r.key).join('\n')).digest('hex').slice(0,12);
const pool={version:original.version,revision:`2026-weeks-1-3-${revision}`,legacyRoundKeys:original.legacyRoundKeys||original.rounds.map(r=>r.key),dailyExpansionDate:'2026-10-02',refreshedAt:new Date().toISOString(),rounds:ordered};
await fs.writeFile(new URL('../dist/data.js',import.meta.url),`window.MATCHUP_POOL = ${JSON.stringify(pool,null,2)};\n`);
console.log(JSON.stringify(summary));
