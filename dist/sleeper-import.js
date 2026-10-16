(() => {
  function eligible(league) {
    const slots=league.roster_positions?.filter(s=>s!=='BN')||[],scoring=league.scoring_settings;
    return league.sport==='nfl'&&[2025,2026].includes(Number(league.season))&&league.total_rosters===10&&['in_season','complete'].includes(league.status)&&slots.length<=12&&slots.filter(s=>s==='QB').length===1&&slots.every(s=>['QB','RB','WR','TE','FLEX','K','DEF'].includes(s))&&league.settings?.best_ball!==1&&scoring&&[0,.5,1].includes(scoring.rec??0)&&!Object.entries(scoring).some(([k,v])=>v!==0&&/bonus|first_down|rush_att|pass_att|rec_att/.test(k));
  }
  function convert(league,week,weekly,players) {
    const slots=league.roster_positions.filter(s=>s!=='BN'),pairs=new Map();
    for(const team of weekly)if(team.matchup_id!=null){const pair=pairs.get(team.matchup_id)||[];pair.push(team);pairs.set(team.matchup_id,pair);}
    const rounds=[],name=id=>players[id]?.full_name||[players[id]?.first_name,players[id]?.last_name].filter(Boolean).join(' ');
    for(const [matchup,pair] of pairs){
      if(pair.length!==2||pair.some(t=>t.custom_points!=null||!Array.isArray(t.starters)||t.starters.length!==slots.length||new Set(t.starters).size!==slots.length||t.starters.some(id=>!id||id==='0'||!name(id))||!Array.isArray(t.starters_points)||t.starters_points.length!==slots.length||!t.starters_points.every(Number.isFinite)||t.starters_points.filter(n=>n===0).length>=2||!Number.isFinite(t.points)||Math.abs(t.starters_points.reduce((n,p)=>n+p,0)-t.points)>=.01)||pair[0].points===pair[1].points)continue;
      const margin=Math.abs(pair[0].points-pair[1].points);
      rounds.push({key:`${league.league_id}:${week}:${matchup}`,leagueId:league.league_id,season:Number(league.season),week,scoring:league.scoring_settings,resultClass:margin<=5?'close_winner':margin<=15?'competitive_win':margin<30?'comfortable_win':'blowout',teams:pair.map(t=>({total:t.points,players:t.starters.map((player_id,i)=>({player_id,name:name(player_id),slot:slots[i],points:t.starters_points[i]}))})),source:`https://api.sleeper.app/v1/league/${league.league_id}/matchups/${week}`});
    }return rounds;
  }
  async function load(id,request=fetch,onProgress=()=>{}) {
    if(!/^\d{15,22}$/.test(id))throw new Error('Enter a valid Sleeper league ID.');
    const api=async path=>{const response=await request('https://api.sleeper.app/v1/'+path,{signal:AbortSignal.timeout(15000)});if(!response.ok)throw new Error('Sleeper is unavailable or this league could not be found.');return response.json();};
    const league=await api('league/'+id);
    if(!eligible(league))throw new Error('Use a 10-team 2025 or 2026 league with one QB and conventional scoring. Superflex, IDP, best ball, and scoring bonuses are not supported.');
    const state=await api('state/nfl');
    if(Number(league.season)===2026&&state.season!=='2026')throw new Error('Sleeper season state does not match this league.');
    const completed=Number(league.season)===2025?18:state.season_type==='regular'?Math.max(0,Number(state.week)-1):state.season_type==='post'?18:0;
    const last=Math.min(18,completed,Number(league.settings.last_scored_leg)||0);
    if(!last)throw new Error('No fully completed weeks yet.');
    const players=await api('players/nfl'),rounds=[];
    for(let week=1;week<=last;week++) {onProgress(week,last);const weekly=await api(`league/${id}/matchups/${week}`);if(!Array.isArray(weekly))throw new Error('Unexpected Sleeper matchup response.');rounds.push(...convert(league,week,weekly,players));}
    if(rounds.length<5)throw new Error(`Only ${rounds.length} eligible matchups. At least five are needed; try a league with more completed weeks.`);
    return {version:'league-'+id,revision:'league-'+id+'-'+last,custom:true,leagueId:id,rounds};
  }
  globalThis.SleeperImport={eligible,convert,load};
})();
