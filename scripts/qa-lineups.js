async page => {
  const season=new URL(page.url()).searchParams.get('season')||'2026';
  await page.goto(`http://127.0.0.1:4317/?practice=layout-audit&season=${season}`);
  await page.locator('.roster').waitFor();
  await page.evaluate(()=>document.fonts.ready);
  const reports=[];
  for(const width of [320,360,375,393,430,600,601,768,800,801,1024,1440]) {
    await page.setViewportSize({width,height:850});
    reports.push(await page.evaluate(()=>{
      const roster=document.querySelector('.roster');
      const template=roster.querySelector('.paired-row').cloneNode(true);
      const failures=[];
      let rowsChecked=0;
      const rect=e=>e.getBoundingClientRect();
      const intersects=(a,b)=>Math.min(a.right,b.right)-Math.max(a.left,b.left)>1 && Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1;
      const pool=new URLSearchParams(location.search).get('season')==='2025'?window.MATCHUP_POOL_2025:window.MATCHUP_POOL;
      for(const round of pool.rounds) {
        roster.replaceChildren(...round.teams[0].players.map((p,i)=>{
          const row=template.cloneNode(true);row.dataset.row=i;
          row.querySelector('.slot span').textContent=p.slot;
          row.querySelectorAll('.player').forEach((cell,s)=>{
            const player=round.teams[s].players[i];
            cell.querySelector('.player-name').textContent=player.name;
            cell.querySelector('.player-meta').textContent=player.slot;
            cell.querySelector('.player-score').dataset.testPoints=player.points.toFixed(2);
          });
          return row;
        }));
        for(const state of ['','revealed on-air','revealed hinted']) {
          for(const row of roster.children) {
            row.className='paired-row '+state;
            row.querySelectorAll('.player-score').forEach(score=>score.textContent=state?score.dataset.testPoints:'\u2014');
          }
          for(const row of roster.children) {
            rowsChecked++;
            const cells=[...row.querySelectorAll('.player')];
            const portraits=cells.map(c=>rect(c.querySelector('.portrait')));
            const scores=cells.map(c=>rect(c.querySelector('.player-score')));
            const names=cells.map(c=>rect(c.querySelector('.player-name')));
            if(innerWidth<=600 && Math.abs(names[0].top-names[1].top)>1) failures.push({key:round.key,state,issue:'name alignment'});
            if(Math.abs(portraits[0].top-portraits[1].top)>1 || Math.abs(scores[0].bottom-scores[1].bottom)>1) failures.push({key:round.key,row:row.dataset.row,state,issue:'paired alignment'});
            for(const cell of cells) {
              const p=rect(cell),portrait=rect(cell.querySelector('.portrait')),name=rect(cell.querySelector('.player-name')),score=rect(cell.querySelector('.player-score')),slot=rect(row.querySelector('.slot'));
              const range=document.createRange();range.selectNodeContents(cell.querySelector('.player-score'));
              if(range.getBoundingClientRect().width>score.width+1) failures.push({key:round.key,state,issue:'score overflow'});
              if(portrait.left<p.left+7 || portrait.right>p.right || portrait.top<p.top || portrait.bottom>p.bottom) failures.push({key:round.key,state,issue:'portrait boundary'});
              if(intersects(portrait,name)||intersects(portrait,score)||intersects(slot,portrait)||intersects(slot,name)||intersects(name,score)) failures.push({key:round.key,state,issue:'overlap'});
            }
          }
        }
      }
      return {width:innerWidth,rounds:pool.rounds.length,rowsChecked,overflow:document.documentElement.scrollWidth>innerWidth,failures:failures.slice(0,10),failureCount:failures.length};
    }));
  }
  if(reports.some(r=>r.failureCount||r.overflow)) throw Error(JSON.stringify(reports));
  return reports;
}
