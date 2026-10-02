export function fantasyPoints(stats,scoring) {
  return Math.round(Object.entries(scoring).reduce((sum,[key,value])=>sum+(Number.isFinite(stats[key])?stats[key]:0)*value,0)*100)/100;
}

export function priorGames(records,season,week) {
  return records.filter(r=>r.season_type==='regular' && (Number(r.season)<season || Number(r.season)===season && r.week<week) && r.stats?.gp>0)
    .sort((a,b)=>Number(b.season)-Number(a.season)||b.week-a.week).slice(0,3);
}

export function matchupOpponent(record,schedule,season,week) {
  if(!record || Number(record.season)!==season || record.week!==week || !record.team)return null;
  const game=schedule.find(g=>g.week===week && [g.home,g.away].includes(record.team));
  if(!game)return null;
  if(record.game_id && game.game_id!==record.game_id)throw new Error(`Game identity disagreement: ${season} W${week} ${record.player_id}`);
  const opponent=game.home===record.team?game.away:game.home;
  if(record.opponent && opponent!==record.opponent)throw new Error(`Schedule disagreement: ${season} W${week} ${record.player_id}`);
  return {team:record.team,opponent,home:game.home===record.team};
}
