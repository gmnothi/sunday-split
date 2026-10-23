import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {fantasyPoints,priorGames,matchupOpponent} from './player-context.mjs';
const record=(season,week,stats={gp:1})=>({season,week,season_type:'regular',stats});
const history=[record(2025,17),record(2025,18,{gp:1,pts_ppr:0}),record(2026,1),record(2026,2,{gp:0}),record(2026,3),record(2026,4),{...record(2026,2),season_type:'pre'}];
assert.deepEqual(priorGames(history,2026,3).map(g=>[g.season,g.week]),[[2026,1],[2025,18],[2025,17]]);
assert.deepEqual(priorGames(history,2026,1).map(g=>g.week),[18,17]);
assert.equal(priorGames([],2026,1).length,0);
const stats={pass_yd:200,pass_td:2,pass_int:1,rush_yd:20,rec:3,rec_yd:40,fum_lost:1};
assert.equal(fantasyPoints(stats,{pass_yd:.04,pass_td:4,pass_int:-2,rush_yd:.1,rec:1,rec_yd:.1,fum_lost:-2}),21);
assert.equal(fantasyPoints(stats,{pass_td:6,rec:.5}),13.5);
assert.equal(fantasyPoints({pts_allow_7_13:1,sack:3},{pts_allow_7_13:4,sack:1}),7);
const traded={...record(2025,1),player_id:'test',team:'SEA',opponent:'SF',player:{team:'NYJ'}};
const schedule=[{week:1,home:'SEA',away:'SF'}];
assert.deepEqual(matchupOpponent(traded,schedule,2025,1),{team:'SEA',opponent:'SF',home:true});
assert.equal(matchupOpponent(traded,schedule,2025,2),null);
assert.throws(()=>matchupOpponent({...traded,opponent:'LA'},schedule,2025,1));
const rescheduled=[
  {week:6,home:'DAL',away:'SEA',game_id:'canceled-game',status:'canceled'},
  {week:6,home:'DEN',away:'SEA',game_id:'played-game',status:'complete'},
];
const seattle={...record(2026,6),player_id:'test',team:'SEA',opponent:'DEN',game_id:'played-game'};
assert.deepEqual(matchupOpponent(seattle,rescheduled,2026,6),{team:'SEA',opponent:'DEN',home:false});
assert.deepEqual(matchupOpponent({...seattle,game_id:undefined},rescheduled,2026,6),{team:'SEA',opponent:'DEN',home:false});
assert.equal(matchupOpponent(seattle,rescheduled.slice(0,1),2026,6),null,'Canceled games must not supply opponents');
assert.throws(()=>matchupOpponent({...seattle,game_id:'unknown'},rescheduled,2026,6));
assert.throws(()=>matchupOpponent({...seattle,opponent:'DAL'},rescheduled,2026,6));
assert.throws(()=>matchupOpponent({...seattle,game_id:undefined},[...rescheduled,{week:6,home:'SEA',away:'SF'}],2026,6));

const ctx={window:{}};
for(const file of ['data.js','data-2025.js','clues-2026.js','clues-2025.js','clues.js'])vm.runInNewContext(fs.readFileSync(new URL('../dist/'+file,import.meta.url),'utf8'),ctx);
let checked=0;
for(const pool of [ctx.window.MATCHUP_POOL,ctx.window.MATCHUP_POOL_2025])for(const round of pool.rounds)for(const player of round.teams.flatMap(t=>t.players)) {
  const clue=ctx.window.PlayerClues.player(round,player.player_id);
  assert(clue,`${round.key}/${player.player_id}: missing clue`);
  const games=clue.games;
  assert(games.length<=3);
  assert.equal(new Set(games.map(g=>g.season+':'+g.week)).size,games.length);
  for(const g of games)assert(g.season<round.season || g.season===round.season && g.week<round.week);
  if(games.length)assert.equal(clue.average,Math.round(games.reduce((n,g)=>n+g.points,0)/games.length*100)/100);
  else assert.equal(clue.average,null);
  if(clue.opponent) {
    assert(clue.opponent.team && clue.opponent.opponent);
    assert.notEqual(clue.opponent.team,clue.opponent.opponent);
    assert.equal(typeof clue.opponent.home,'boolean');
  }
  checked++;
}
const round=ctx.window.MATCHUP_POOL.rounds[0],player=round.teams[0].players[0];
const data=ctx.window.LINEUP_CLUES[round.season],key=`${data.formats[round.leagueId]}:${round.week}:${player.player_id}`;
data.form[key].games.push({season:round.season,week:round.week,points:99});
assert.equal(ctx.window.PlayerClues.player(round,player.player_id),null,'Runtime must reject lookahead data');
console.log(`${checked} player clues passed; scoring, prior-season carryover, byes, zero-point games, trade-safe opponents and no lookahead verified.`);
