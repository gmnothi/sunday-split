(() => {
  const pack = window.ROUND_PACK;
  const app = document.querySelector('#app');
  const storageKey = `sunday-split:${pack.id}`;
  const labels = ['A', 'B'];
  let results = [], hint = null, hintMode = false, revealing = false, finished = false;
  let timers = [], animations = [], reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let index = 0;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt = n => Number(n).toFixed(2);
  const icon = name => `<i data-lucide="${name}" aria-hidden="true"></i>`;
  const round = () => pack.rounds[index];
  const winner = r => r.teams[0].total > r.teams[1].total ? 0 : 1;
  const correct = (r,i) => r.pick === winner(pack.rounds[i]);
  const points = () => results.reduce((sum,r,i)=>sum+(correct(r,i) ? r.hint === null ? 2 : 1 : 0),0);
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (saved && Array.isArray(saved.results) && saved.results.length <= 5 && saved.results.every((r,i) =>
      [0,1].includes(r.pick) && (r.hint === null || Number.isInteger(r.hint) && r.hint >= 0 && r.hint < pack.rounds[i].teams[0].players.length))) {
      results = saved.results;
      index = results.length === 5 ? 5 : Math.max(0,results.length-1);
      if (results.length === 0) index = 0;
      if (saved.pendingIndex === results.length && results.length < 5) index = results.length;
      const pending = saved.pendingHint;
      if (index === results.length && Number.isInteger(pending) && pending >= 0 && pending < pack.rounds[index]?.teams[0].players.length) hint = pending;
    }
  } catch { /* Browser storage is optional. */ }
  function save() {
    try { localStorage.setItem(storageKey,JSON.stringify({results,pendingIndex:index,pendingHint:hint})); } catch {}
  }
  function icons() { window.lucide?.createIcons(); }
  function notify(message) {
    const t = document.querySelector('#toast'); t.textContent = message; t.classList.add('visible');
    setTimeout(()=>t.classList.remove('visible'),2400);
  }
  function cancel() { timers.forEach(clearTimeout); timers=[]; animations.forEach(cancelAnimationFrame); animations=[]; }
  function progress() {
    return `<div class="progress" aria-label="Round progress">${pack.rounds.map((_,i)=> {
      const r = results[i];
      return `<span class="step ${r ? correct(r,i) ? 'correct' : 'wrong' : i === index ? 'current' : ''}" aria-label="Round ${i+1}${r ? correct(r,i) ? ': correct' : ': incorrect' : ''}">${r ? icon(correct(r,i)?'check':'x') : i+1}</span>`;
    }).join('')}</div>`;
  }
  function player(p,side,i,slotLabel) {
    const defense = p.slot === 'DEF';
    return `<div class="player ${side === 1 ? 'right-player' : ''}" data-side="${side}" data-row="${i}">
      <div class="portrait">${defense ? `<span class="defense">${esc(p.player_id)}</span>` : `<span class="initials">${esc(p.name.split(' ').map(n=>n[0]).slice(0,2).join(''))}</span><img src="https://sleepercdn.com/content/nfl/players/thumb/${encodeURIComponent(p.player_id)}.jpg" alt="" loading="eager" decoding="async">`}</div>
      <div class="player-info"><span class="player-name">${esc(p.name)}</span><span class="player-meta">${esc(slotLabel)}${defense ? ' / TEAM DEFENSE' : ''}</span></div>
      <span class="player-score" aria-label="Points hidden">&mdash;</span>
    </div>`;
  }
  function render() {
    cancel();
    if (index >= 5) { summary(); return; }
    const r = round(); const played = results[index]; hint = played ? played.hint : hint;
    finished = !!played; revealing=false; hintMode=false;
    const scoring = r.scoring.rec === 1 ? 'PPR' : r.scoring.rec === 0.5 ? 'HALF PPR' : 'STANDARD';
    const seen = {};
    const slotLabels = r.teams[0].players.map(p=> {
      const count = r.teams[0].players.filter(q=>q.slot===p.slot).length;
      seen[p.slot] = (seen[p.slot]||0)+1;
      return p.slot==='DEF' ? 'DST' : `${p.slot}${count>1 ? seen[p.slot] : ''}`;
    });
    app.innerHTML = `<section class="game-top"><div><div class="eyebrow">DAILY MATCHUPS <span class="mini-slash">/</span> PACK 01</div><h1>Who won this matchup?</h1></div><div class="session-score"><span>${points()}<small>/10</small></span><label>YOUR POINTS</label></div></section>
      <div class="round-bar">${progress()}<span class="round-count">ROUND ${index+1} OF 5</span></div>
      <section class="matchup" aria-label="Fantasy matchup">
        <div class="matchup-meta"><span>${r.season} <span>/</span> WEEK ${r.week}</span><button class="scoring-trigger" id="scoring" aria-expanded="false">${scoring} <span>/</span> ${r.scoring.pass_td}-PT PASS TD ${icon('info')}</button></div>
        <div id="scoring-detail" hidden>Passing: ${r.scoring.pass_yd} points/yard, ${r.scoring.pass_td}/TD, ${r.scoring.pass_int}/INT. Rushing and receiving: ${r.scoring.rush_yd} and ${r.scoring.rec_yd} points/yard; ${r.scoring.rush_td} and ${r.scoring.rec_td}/TD. Receptions: ${r.scoring.rec || 0}. <a href="${r.source.replace(/\/matchups\/\d+$/,'')}" target="_blank" rel="noopener">Full league scoring</a></div>
        <div class="scoreboard"><div class="team-head team-a"><div><span class="team-tag">LINEUP A</span><h2>The home side</h2></div><span class="total" id="total-0">&mdash;</span></div><div class="versus">VS</div><div class="team-head team-b"><div><span class="team-tag">LINEUP B</span><h2>The away side</h2></div><span class="total" id="total-1">&mdash;</span></div></div>
        <div class="roster">${r.teams[0].players.map((p,i)=>`<div class="paired-row" data-row="${i}">${player(p,0,i,slotLabels[i])}<button class="slot" data-hint="${i}" aria-label="Reveal both ${slotLabels[i]} scores" title="Reveal both ${slotLabels[i]} scores" disabled><span>${slotLabels[i]}</span>${icon('eye')}</button>${player(r.teams[1].players[i],1,i,slotLabels[i])}</div>`).join('')}</div>
        <div class="hint-bar"><button id="hint" class="hint-button">${icon('scan-eye')} <span>${hint === null ? 'Use a hint' : `${slotLabels[hint]} revealed`}</span></button><span id="hint-note">${hint === null ? 'Unassisted win: 2 pts' : 'Assisted win: 1 pt'}</span></div>
      </section>
      <div class="decision" id="decision"><button class="pick pick-a" data-pick="0">${icon('check')} Pick lineup A</button><span class="decision-or">OR</span><button class="pick pick-b" data-pick="1">${icon('check')} Pick lineup B</button></div>
      <section id="result" class="result" hidden aria-live="polite"></section>
      <div class="reveal-status" id="reveal-status" aria-live="polite"></div>`;
    document.querySelectorAll('img').forEach(img=>img.addEventListener('error',()=>img.remove(),{once:true}));
    document.querySelector('#scoring').onclick = e => {
      const d = document.querySelector('#scoring-detail'); d.hidden=!d.hidden; e.currentTarget.setAttribute('aria-expanded',String(!d.hidden));
    };
    document.querySelectorAll('[data-pick]').forEach(b=>b.onclick=()=>pick(Number(b.dataset.pick)));
    document.querySelector('#hint').onclick = toggleHint;
    document.querySelectorAll('[data-hint]').forEach(b=>b.onclick=()=>useHint(Number(b.dataset.hint)));
    if(hint !== null) revealRow(hint,true);
    if(played) { allRows(); showResult(); }
    icons();
    const next = pack.rounds[index+1];
    if(next) next.teams.flatMap(t=>t.players).filter(p=>p.slot!=='DEF').forEach(p=>{const img=new Image();img.src=`https://sleepercdn.com/content/nfl/players/thumb/${p.player_id}.jpg`;});
  }
  function toggleHint() {
    if(hint !== null || revealing || finished) return;
    hintMode=!hintMode;
    document.querySelector('.roster').classList.toggle('choosing-hint',hintMode);
    document.querySelectorAll('[data-hint]').forEach(b=>b.disabled=!hintMode);
    document.querySelector('#hint').classList.toggle('active',hintMode);
    document.querySelector('#hint span').textContent=hintMode?'Cancel hint':'Use a hint';
    document.querySelector('#hint-note').textContent=hintMode?'Choose a position':'Unassisted win: 2 pts';
  }
  function useHint(i) {
    if(!hintMode || hint !== null || finished) return;
    toggleHint(); hint=i; save(); revealRow(i,true);
    const b=document.querySelector('#hint'); b.disabled=true;
    b.querySelector('span').textContent=`${document.querySelector(`[data-hint="${i}"] span`).textContent} revealed`;
    document.querySelector('#hint-note').textContent='Assisted win: 1 pt';
  }
  function revealRow(i,assisted=false) {
    const row=document.querySelector(`.paired-row[data-row="${i}"]`);
    row.classList.add('revealed'); if(assisted) row.classList.add('hinted');
    round().teams.forEach((t,s)=> {
      const score=row.querySelector(`[data-side="${s}"] .player-score`);
      score.textContent=fmt(t.players[i].points); score.setAttribute('aria-label',`${t.players[i].points} points`);
      if(!reduceMotion) score.animate([{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}],{duration:350,easing:'ease-out'});
    });
  }
  function countTotal(side,target) {
    const el=document.querySelector(`#total-${side}`);
    const start=Number(el.dataset.value || 0); el.dataset.value=target;
    if(reduceMotion) {el.textContent=fmt(target);return;}
    const begin=performance.now();
    const tick = now=> {const p=Math.min((now-begin)/450,1);el.textContent=fmt(start+(target-start)*(1-Math.pow(1-p,3)));if(p<1) animations.push(requestAnimationFrame(tick));};
    animations.push(requestAnimationFrame(tick));
  }
  function pick(side) {
    if(finished || revealing || results[index]) return;
    if(hintMode) toggleHint();
    results.push({pick:side,hint}); save(); revealing=true;
    document.querySelectorAll('[data-pick]').forEach(b=>{b.disabled=true;b.classList.toggle('picked',Number(b.dataset.pick)===side);});
    document.querySelector('#hint').disabled=true;
    document.querySelector('#decision').innerHTML=`<span class="locked">${icon('lock-keyhole')} Lineup ${labels[side]} locked in</span><button id="skip" class="text-button">Show all ${icon('fast-forward')}</button>`;
    document.querySelector('#skip').onclick=()=> {cancel();allRows();showResult();};
    const groups=['QB','RB','WR','TE','FLEX','SPECIAL TEAMS'].map(group=>({group,rows:round().teams[0].players.map((p,i)=>({p,i})).filter(({p})=>group==='SPECIAL TEAMS'?['K','DEF'].includes(p.slot):p.slot===group).map(({i})=>i)})).filter(g=>g.rows.length);
    const revealed=new Set();
    groups.forEach((g,j)=>timers.push(setTimeout(()=> {
      g.rows.forEach(i=>{revealRow(i);revealed.add(i);});
      const totals=round().teams.map(t=>t.players.reduce((sum,p,i)=>sum+(revealed.has(i)?p.points:0),0));
      totals.forEach((n,s)=>countTotal(s,n));
      document.querySelectorAll('.team-head').forEach((el,s)=>el.classList.toggle('leading',totals[s]>totals[1-s]));
      document.querySelector('#reveal-status').textContent=`${g.group} scores revealed`;
    },reduceMotion?0:450+j*800)));
    timers.push(setTimeout(()=>showResult(),reduceMotion?30:450+groups.length*800)); icons();
  }
  function allRows() {
    round().teams[0].players.forEach((_,i)=>revealRow(i));
    round().teams.forEach((t,s)=>{const el=document.querySelector(`#total-${s}`);el.textContent=fmt(t.total);el.dataset.value=t.total;});
  }
  function showResult() {
    revealing=false;finished=true;
    const r=round(), win=winner(r), entry=results[index], ok=entry.pick===win;
    const earned=ok ? entry.hint === null ? 2:1:0;
    const swings={};
    r.teams[win].players.forEach((p,i)=>{const group=['K','DEF'].includes(p.slot)?'special teams':p.slot;swings[group]=(swings[group]||0)+p.points-r.teams[1-win].players[i].points;});
    const [position,advantage]=Object.entries(swings).sort((a,b)=>b[1]-a[1])[0];
    allRows();
    document.querySelector('#decision').hidden=true;
    document.querySelector('#reveal-status').textContent='';
    document.querySelectorAll('.team-head').forEach((el,s)=>{el.classList.remove('leading');el.classList.toggle('winner',s===win);});
    const section=document.querySelector('#result');section.hidden=false;
    section.innerHTML=`<div class="result-icon ${ok?'success':'miss'}">${icon(ok?'check':'x')}</div><div class="result-copy"><div class="result-kicker">${ok?'GOOD CALL':'NOT THIS TIME'} <span>+${earned} ${earned===1?'PT':'PTS'}</span></div><h3>Lineup ${labels[win]} won by ${fmt(Math.abs(r.teams[0].total-r.teams[1].total))}.</h3><p>Biggest edge: ${position === 'special teams' ? position : position+'s'}, +${fmt(advantage)} points.</p><details><summary>Matchup source</summary><a href="${r.source}" target="_blank" rel="noopener">Sleeper / 2026 / Week ${r.week} / ${esc(r.leagueId)}</a></details></div><button id="next" class="next-button">${index===4?'See results':'Next round'} ${icon(index===4?'trophy':'chevron-right')}</button>`;
    document.querySelector('#hint').disabled=true;
    document.querySelector('.session-score>span').innerHTML=`${points()}<small>/10</small>`;
    document.querySelector('#next').onclick=()=>{index++;hint=null;save();render();window.scrollTo({top:0,behavior:reduceMotion?'instant':'smooth'});};
    icons();
    if(ok && !reduceMotion) section.animate([{transform:'translateY(10px)',opacity:0},{transform:'translateY(0)',opacity:1}],{duration:450,easing:'ease-out'});
  }
  function summary() {
    const wins=results.filter(correct).length;
    const unassisted=results.filter((r,i)=>correct(r,i)&&r.hint===null).length;
    app.innerHTML=`<section class="summary"><div class="eyebrow">PACK 01 COMPLETE</div><div class="trophy">${icon('trophy')}</div><h1>${wins===5?'A perfect read.':wins>=3?'You know ball.':'Any given Sunday.'}</h1><p class="summary-sub">Five matchups. Your calls are in.</p><div class="big-result">${wins}<span>/5</span></div><span class="summary-label">WINNERS PICKED</span>${progress()}<div class="summary-stats"><div><strong>${points()}<small>/10</small></strong><span>POINTS</span></div><div><strong>${unassisted}</strong><span>UNASSISTED WINS</span></div><div><strong>${results.filter(r=>r.hint!==null).length}</strong><span>HINTS USED</span></div></div><div class="round-recap">${results.map((r,i)=>`<div><span class="recap-round">${String(i+1).padStart(2,'0')}</span><span>Lineup ${labels[r.pick]} ${icon(correct(r,i)?'check':'x')}</span><span>${r.hint===null?'Unassisted':'With hint'}</span><strong>${correct(r,i)?r.hint===null?2:1:0} pts</strong></div>`).join('')}</div><button id="share" class="share-button">${icon('share-2')} Share results</button><button id="replay" class="text-button">${icon('rotate-ccw')} Replay prototype</button><p class="prototype-note">Curated pack 01. Replays use the same five matchups.</p></section>`;
    document.querySelector('#share').onclick=async()=> {
      const text=`Sunday Split / Pack 01\n${results.map((r,i)=>correct(r,i)?'🟩':'🟥').join('')} ${wins}/5\n${points()}/10 points · ${unassisted} unassisted wins`;
      try {await navigator.clipboard.writeText(text);notify('Results copied');} catch {const dialog=document.createElement('dialog');dialog.innerHTML='<h2>Your results</h2><textarea aria-label="Shareable results" readonly></textarea><button>Close</button>';document.body.append(dialog);dialog.querySelector('textarea').value=text;dialog.querySelector('button').onclick=()=>dialog.remove();dialog.showModal();dialog.querySelector('textarea').select();}
    };
    document.querySelector('#replay').onclick=()=>{if(!confirm('Replay the same five matchups? Your saved prototype score will reset.'))return;results=[];index=0;hint=null;save();render();window.scrollTo(0,0);};
    icons();
  }
  const motion=document.querySelector('#motion');
  function updateMotion() {motion.setAttribute('aria-pressed',String(reduceMotion));motion.title=reduceMotion?'Enable animations':'Reduce motion';motion.setAttribute('aria-label',motion.title);}
  motion.onclick=()=>{reduceMotion=!reduceMotion;updateMotion();notify(reduceMotion?'Reduced motion enabled':'Animations enabled');if(revealing){cancel();allRows();showResult();}};
  updateMotion();render();
})();
