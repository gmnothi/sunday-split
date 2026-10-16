(() => {
  function analyze(round,clues) {
    const teams=round.teams.map((team,side)=>{
      const players=team.players.map(player=>{
        const clue=clues?.player(round,player.player_id);
        const count=clue?.games?.length||0;
        const average=count&&Number.isFinite(clue.average)?clue.average:null;
        return {...player,side,count,average,delta:average===null?null:Math.round((player.points-average)*100)/100};
      });
      const complete=players.every(p=>p.count===3&&p.average!==null);
      return {players,complete,baseline:complete?players.reduce((n,p)=>n+p.average,0):null,total:team.total};
    });
    const complete=teams.every(t=>t.complete);
    const baselineWinner=complete?teams[0].baseline===teams[1].baseline?null:teams[0].baseline>teams[1].baseline?0:1:null;
    const winner=teams[0].total>teams[1].total?0:1;
    const swings=teams.flatMap(t=>t.players).filter(p=>p.delta!==null).sort((a,b)=>Math.abs(b.delta)-Math.abs(a.delta));
    return {teams,complete,baselineWinner,winner,swings};
  }
  window.FilmRoom={analyze};
  document.addEventListener('split:reveal',({detail:d})=>{
    const result=document.querySelector('#result');if(!result||result.querySelector('[data-film]'))return;
    const {esc,dialog,button}=window.SplitSocial;
    const b=button('Film Room','clapperboard',()=>{
      const report=analyze(d.round,window.PlayerClues),fmt=n=>n.toFixed(2);
      const baseline=report.complete?`Recent-form totals: A ${fmt(report.teams[0].baseline)} / B ${fmt(report.teams[1].baseline)}. ${report.baselineWinner===null?'The baseline was even.':`The baseline favored ${['A','B'][report.baselineWinner]}; ${report.baselineWinner===report.winner?'that held up.':'the result went the other way.'}`}`:'Full three-game history is unavailable for one or more starters; no team baseline is shown.';
      const el=dialog('Film Room',`<p>${esc(baseline)}</p><p class="social-note">Recent form is a clue, not a projection. Only games before this matchup are used.</p><label>Lineup<select aria-label="Film Room lineup"><option value="0">A</option><option value="1">B</option></select></label><div class="film-table"></div>`);
      const render=()=>{const players=report.teams[Number(el.querySelector('select').value)].players;el.querySelector('.film-table').innerHTML=`<table><caption>Actual points vs prior-game average</caption><thead><tr><th>Starter</th><th>Prior avg</th><th>Actual</th><th>Change</th></tr></thead><tbody>${players.map(p=>`<tr><th scope="row">${esc(p.name)}<br><small>${esc(p.slot)} / ${p.count} prior games</small></th><td>${p.average===null?'N/A':fmt(p.average)}</td><td>${fmt(p.points)}</td><td>${p.delta===null?'N/A':(p.delta>=0?'+':'')+fmt(p.delta)}</td></tr>`).join('')}</tbody></table>`;};el.querySelector('select').onchange=render;render();
    });b.dataset.film='';result.append(b);window.lucide?.createIcons();
  });
})();
