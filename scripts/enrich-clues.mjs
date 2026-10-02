import fs from 'node:fs/promises';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {fantasyPoints,priorGames,matchupOpponent} from './player-context.mjs';

const root=new URL('../',import.meta.url),cache=new URL('.sites-runtime/clues-cache/',root);
await fs.mkdir(cache,{recursive:true});
const pools=[];
for(const season of [2025,2026]) {
  const context={window:{}};
  vm.runInNewContext(await fs.readFile(new URL(`dist/data${season===2025?'-2025':''}.js`,root),'utf8'),context);
  pools.push(season===2025?context.window.MATCHUP_POOL_2025:context.window.MATCHUP_POOL);
}
async function request(path) {
  const file=new URL(path.replace(/[^a-z0-9]/gi,'_')+'.json',cache);
  if(!process.argv.includes('--fresh'))try{return JSON.parse(await fs.readFile(file,'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;}
  await new Promise(resolve=>setTimeout(resolve,150));
  const response=await fetch(`https://api.sleeper.app/${path}`,{signal:AbortSignal.timeout(25000)});
  assert(response.ok,`${path}: HTTP ${response.status}`);
  const data=await response.json();assert(Array.isArray(data),`Unexpected response: ${path}`);
  await fs.writeFile(file,JSON.stringify(data));return data;
}
const records=new Map(),weekly=new Map(),schedules=new Map();
for(const season of [2024,2025,2026]) {
  const maxWeek=season===2026?Math.max(...pools[1].rounds.map(r=>r.week)):18;
  schedules.set(season,await request(`schedule/nfl/regular/${season}`));
  for(let week=1;week<=maxWeek;week++) {
    const rows=await request(`stats/nfl/${season}/${week}?season_type=regular`);
    weekly.set(`${season}:${week}`,new Map(rows.map(r=>[r.player_id,r])));
    for(const row of rows) {
      assert.equal(Number(row.season),season);assert.equal(row.week,week);assert.equal(row.season_type,'regular');
      if(!records.has(row.player_id))records.set(row.player_id,[]);
      records.get(row.player_id).push(row);
    }
    console.log(`Loaded ${season} week ${week}: ${rows.length} player records`);
  }
}
const report=[];
for(const pool of pools) {
  const season=pool.rounds[0].season;
  const clues={version:1,season,generatedAt:new Date().toISOString(),formats:{},opponents:{},form:{},sources:{stats:'https://api.sleeper.app/stats/nfl/{season}/{week}?season_type=regular',schedule:`https://api.sleeper.app/schedule/nfl/regular/${season}`,opponentFallback:'https://api.sleeper.app/projections/nfl/{season}/{week}?season_type=regular (team and game identity only; projected scores are not used)'}};
  const projections=new Map();
  let checked=0,missingOpponent=0,missingHistory=0;
  const mismatches=[];
  for(const round of pool.rounds) {
    const scoring=Object.fromEntries(Object.entries(round.scoring).filter(([,v])=>v!==0).sort(([a],[b])=>a.localeCompare(b)));
    const format=createHash('sha256').update(JSON.stringify(scoring)).digest('hex').slice(0,12);
    if(clues.formats[round.leagueId])assert.equal(clues.formats[round.leagueId],format);
    clues.formats[round.leagueId]=format;
    for(const player of round.teams.flatMap(t=>t.players)) {
      const playerKey=`${round.week}:${player.player_id}`,formKey=`${format}:${playerKey}`;
      const row=weekly.get(`${season}:${round.week}`).get(player.player_id);
      if(!(playerKey in clues.opponents))clues.opponents[playerKey]=matchupOpponent(row,schedules.get(season),season,round.week);
      if(!clues.opponents[playerKey]) {
        if(!projections.has(round.week))projections.set(round.week,new Map((await request(`projections/nfl/${season}/${round.week}?season_type=regular`)).map(p=>[p.player_id,p])));
        const projected=projections.get(round.week).get(player.player_id);
        if(projected?.game_id)clues.opponents[playerKey]=matchupOpponent(projected,schedules.get(season),season,round.week);
      }
      if(!clues.opponents[playerKey])missingOpponent++;
      if(!(formKey in clues.form)) {
        const games=priorGames(records.get(player.player_id)||[],season,round.week).map(g=>({season:Number(g.season),week:g.week,points:fantasyPoints(g.stats,scoring)}));
        clues.form[formKey]={average:games.length?Math.round(games.reduce((sum,g)=>sum+g.points,0)/games.length*100)/100:null,games};
      }
      if(!clues.form[formKey].games.length)missingHistory++;
      if(row?.stats?.gp>0) {
        checked++;const calculated=fantasyPoints(row.stats,scoring);
        if(Math.abs(calculated-player.points)>.011)mismatches.push({round:round.key,player:player.player_id,calculated,stored:player.points});
      }
    }
  }
  assert.equal(mismatches.length,0,`Scoring mismatches: ${JSON.stringify(mismatches.slice(0,10))}`);
  const starters=pool.rounds.reduce((n,r)=>n+r.teams.reduce((sum,t)=>sum+t.players.length,0),0);
  assert(checked>=starters*.95,`Insufficient verified stats coverage for ${season}`);
  assert(missingOpponent<=starters*.05,`Insufficient opponent coverage for ${season}`);
  await fs.writeFile(new URL(`dist/clues-${season}.js`,root),`(window.LINEUP_CLUES ||= {})[${season}] = ${JSON.stringify(clues)};\n`);
  report.push({season,rounds:pool.rounds.length,verifiedScores:checked,uniqueForms:Object.keys(clues.form).length,missingOpponent,missingHistory});
}
await fs.mkdir(new URL('research/',root),{recursive:true});
await fs.writeFile(new URL('research/player-clues-report.json',root),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
