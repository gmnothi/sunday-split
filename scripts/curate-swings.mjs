import fs from 'node:fs';
import vm from 'node:vm';
const ctx={window:{}};
for(const file of ['data.js','data-2025.js','clues-2026.js','clues-2025.js','clues.js'])vm.runInNewContext(fs.readFileSync(new URL('../dist/'+file,import.meta.url),'utf8'),ctx);
const seasons={},reports=[];
for(const pool of [ctx.window.MATCHUP_POOL,ctx.window.MATCHUP_POOL_2025]) {
  const metrics=pool.rounds.map(r=>{
    const win=r.teams[0].total>r.teams[1].total?0:1;
    const forms=r.teams.map(t=>t.players.map(p=>ctx.window.PlayerClues.player(r,p.player_id)));
    const complete=forms.every(team=>team.every(c=>c?.games.length===3));
    const averages=forms.map(team=>team.reduce((n,c)=>n+(c?.average||0),0));
    const deficit=complete?Math.max(0,averages[1-win]-averages[win]):0;
    const departures=r.teams.flatMap((t,s)=>t.players.map((p,i)=>forms[s][i]?.games.length===3?Math.abs(p.points-forms[s][i].average):0));
    const burst=Math.max(...departures);
    let tally=0,maxReversal=0;
    for(const group of ['QB','RB','WR','TE','FLEX','SPECIAL']) {
      r.teams[0].players.forEach((p,i)=>{
        if(group==='SPECIAL'?['K','DEF'].includes(p.slot):p.slot===group) {
          tally+=r.teams[win].players[i].points-r.teams[1-win].players[i].points;
          maxReversal=Math.max(maxReversal,-tally);
        }
      });
    }
    const score=Math.round((deficit*1.5+Math.max(0,burst-15)+maxReversal)*100)/100;
    return {key:r.key,season:r.season,week:r.week,resultClass:r.resultClass,score,priorFormDeficit:Math.round(deficit*100)/100,largestPlayerDeparture:Math.round(burst*100)/100,revealDeficit:Math.round(maxReversal*100)/100,completeHistory:complete};
  }).sort((a,b)=>b.score-a.score||a.key.localeCompare(b.key));
  const selected=metrics.filter(m=>m.score>=25&&(m.priorFormDeficit>=15||m.largestPlayerDeparture>=25||m.revealDeficit>=20)).slice(0,Math.ceil(metrics.length*.25));
  seasons[pool.rounds[0].season]=Object.fromEntries(selected.map(m=>[m.key,4]));
  reports.push({season:pool.rounds[0].season,total:metrics.length,featured:selected.length,classes:Object.fromEntries([...new Set(selected.map(m=>m.resultClass))].map(c=>[c,selected.filter(m=>m.resultClass===c).length])),topExamples:selected.slice(0,20),featuredMetrics:selected});
}
const curation={revision:'swings-v1',dailyFrom:'2026-10-03',seasons};
fs.writeFileSync(new URL('../dist/curation.js',import.meta.url),'window.MATCHUP_CURATION='+JSON.stringify(curation)+';\n');
fs.writeFileSync(new URL('../research/swing-curation-report.json',import.meta.url),JSON.stringify({method:'Fourfold selection weight for top-quartile dramatic matchups; prior-form upsets require full three-game history for every starter. Reveal deficits describe presentation order, not NFL chronology.',reports},null,2)+'\n');
console.log(JSON.stringify(reports.map(({season,total,featured,classes})=>({season,total,featured,classes}))));
