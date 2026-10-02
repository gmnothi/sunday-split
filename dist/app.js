(() => {
  const params=new URLSearchParams(location.search);
  const season=params.get('season')==='2025'?2025:2026;
  const pool=season===2025?window.MATCHUP_POOL_2025:window.MATCHUP_POOL;
  const dateParts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Toronto',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
  const date=['year','month','day'].map(type=>dateParts.find(p=>p.type===type).value).join('-');
  const endless=params.get('endless')==='1';
  const confidence=!endless && params.get('confidence')==='1';
  const endlessVersion=pool.revision||pool.version;
  const practiceParam=params.get('practice');
  const practiceSeed=!endless && !confidence && practiceParam && /^[a-zA-Z0-9-]{1,80}$/.test(practiceParam)?practiceParam:(!endless&&!confidence&&season===2025?'throwback-'+date:null);
  let endlessSeed=null;
  if(endless) {
    const key=`sunday-split:endless-seed:${endlessVersion}`;
    try {endlessSeed=localStorage.getItem(key);} catch {}
    if(!endlessSeed || !/^[a-zA-Z0-9-]{1,80}$/.test(endlessSeed)) {
      endlessSeed=crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36)+Math.random().toString(36).slice(2);
      try {localStorage.setItem(key,endlessSeed);} catch {}
    }
  }
  function newPracticeUrl() {
    const seed=crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36)+Math.random().toString(36).slice(2);
    const url=new URL(location.href);url.search='';url.searchParams.set('practice',seed);if(season===2025)url.searchParams.set('season','2025');url.hash='';return url;
  }
  const practiceNav=document.querySelector('#practice-nav');
  practiceNav.href=practiceSeed ? location.href : newPracticeUrl().href;
  for(const id of ['practice-nav','confidence-nav','endless-nav'])if(season===2025){const a=document.querySelector('#'+id);const u=new URL(a.href);u.searchParams.set('season','2025');a.href=u.href;}
  document.querySelector(endless?'#endless-nav':confidence?'#confidence-nav':practiceSeed?'#practice-nav':'#daily-nav').setAttribute('aria-current','page');
  const seasonSelect=document.querySelector('#season');seasonSelect.value=String(season);
  seasonSelect.onchange=()=>{const url=new URL(location.href);url.searchParams.set('season',seasonSelect.value);if(!endless&&!confidence&&!practiceSeed)url.searchParams.set('practice',crypto.randomUUID());location.assign(url);};
  const selectionKey=confidence?`sunday-split:selection:confidence:${season}:${date}`:practiceSeed?`sunday-split:selection:${practiceSeed}${season===2025?':2025':''}`:`sunday-split:selection:daily:${date}:${pool.version}`;
  let savedKeys=null,seen=[];
  try {
    savedKeys=JSON.parse(localStorage.getItem(selectionKey));
    if(!Array.isArray(savedKeys)) savedKeys=null;
    const storedSeen=JSON.parse(localStorage.getItem('sunday-split:seen'));
    if(Array.isArray(storedSeen)) seen=storedSeen.filter(key=>typeof key==='string');
  } catch {}
  const pack=endless ? {id:`endless:${endlessSeed}:${endlessVersion}`,mode:'endless',date,rounds:[]} : window.GamePacks.makePack(pool,{date,practiceSeed,excluded:practiceSeed?seen:[],savedKeys});
  if(confidence) {
    const selected=window.GamePacks.makePack(pool,{date,practiceSeed:`confidence-${season}-${date}`,savedKeys,freezeDaily:true});
    Object.assign(pack,selected,{id:`confidence:${season}:${date}:${pool.version}`,mode:'confidence'});
  }
  function ensureRound(i) {
    if(endless && !pack.rounds[i]) pack.rounds[i]=window.GamePacks.endlessRound(pool,endlessSeed,i);
    return pack.rounds[i];
  }
  if(!endless) try {localStorage.setItem(selectionKey,JSON.stringify(pack.rounds.map(r=>r.key)));} catch {}
  document.querySelector('#pool-count').textContent=`${pool.rounds.length} matchups / ${season} season`;
  const app = document.querySelector('#app');
  const storageKey = `sunday-split:${pack.id}`;
  const labels = ['A', 'B'];
  let results = [], hint = null, hintMode = false, revealing = false, finished = false;
  let timers = [], animations = [], reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let totalFrames = [null, null];
  let index = 0;
  let confidenceValue=null;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt = n => Number(n).toFixed(2);
  const icon = name => `<i data-lucide="${name}" aria-hidden="true"></i>`;
  const round = () => pack.rounds[index];
  const winner = r => r.teams[0].total > r.teams[1].total ? 0 : 1;
  const correct = (r,i) => r.pick === winner(pack.rounds[i]);
  const earned=(r,i)=>confidence?window.Confidence.earned(r,correct(r,i)):correct(r,i)?r.hint===null?2:1:0;
  const points = () => results.reduce((sum,r,i)=>sum+earned(r,i),0);
  const streakKey='sunday-split:daily-completions';
  let completionDates=[];
  try {
    const stored=JSON.parse(localStorage.getItem(streakKey));
    if(Array.isArray(stored)) completionDates=stored;
    // Recover prior completed daily games already saved on this device.
    for(let i=0;i<localStorage.length;i++) {
      const key=localStorage.key(i),match=/^sunday-split:daily:(\d{4}-\d{2}-\d{2}):/.exec(key);
      if(!match) continue;
      const saved=JSON.parse(localStorage.getItem(key));
      if(saved?.results?.length===5 && saved.results.every(r=>r && [0,1].includes(r.pick))) completionDates.push(match[1]);
    }
  } catch {}
  const streak=()=>window.DailyStreaks.stats(completionDates,date);
  function recordDaily() {
    if(pack.mode!=='daily' || results.length!==5) return;
    completionDates=window.DailyStreaks.stats([...completionDates,date],date).dates;
    try {localStorage.setItem(streakKey,JSON.stringify(completionDates));} catch {}
  }
  function dailyStats() {
    const s=streak();
    return `<span>${icon('flame')} <strong>${s.current}</strong> DAILY STREAK</span><span><strong>${s.best}</strong> BEST STREAK</span><span><strong>${s.completed}</strong> DAYS PLAYED</span>`;
  }
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (saved && Array.isArray(saved.results) && (!confidence || window.Confidence.valid(saved.results)) && (endless || saved.results.length <= 5) && saved.results.every((r,i) =>
      r && [0,1].includes(r.pick) && (r.hint === null || Number.isInteger(r.hint) && r.hint >= 0 && r.hint < ensureRound(i).teams[0].players.length))) {
      results = saved.results;
      results.forEach((_,i)=>ensureRound(i));
      index = !endless && results.length === 5 ? 5 : Math.max(0,results.length-1);
      if (results.length === 0) index = 0;
      if (saved.pendingIndex === results.length && (endless || results.length < 5)) index = results.length;
      const pending = saved.pendingHint;
      if (index === results.length && Number.isInteger(pending) && pending >= 0 && pending < ensureRound(index)?.teams[0].players.length) hint = pending;
      if(confidence && window.Confidence.available(results).includes(saved.pendingConfidence))confidenceValue=saved.pendingConfidence;
    }
  } catch { /* Browser storage is optional. */ }
  function save() {
    try {
      localStorage.setItem(storageKey,JSON.stringify({results,pendingIndex:index,pendingHint:hint,pendingConfidence:confidenceValue}));
      if((endless || index<5) && results[index]) {
        const key=pack.rounds[index].key;
        seen=[...new Set([...seen,key])];
        localStorage.setItem('sunday-split:seen',JSON.stringify(seen));
      }
    } catch {}
  }
  function icons() { window.lucide?.createIcons(); }
  function notify(message) {
    const t = document.querySelector('#toast'); t.textContent = message; t.classList.add('visible');
    setTimeout(()=>t.classList.remove('visible'),2400);
  }
  function cancel() { timers.forEach(clearTimeout); timers=[]; animations.forEach(cancelAnimationFrame); animations=[]; document.querySelector('.celebration')?.remove(); }
  function progress() {
    const first=endless?Math.max(0,index-4):0;
    const count=endless?index-first+1:5;
    return `<div class="progress" aria-label="${endless?'Recent rounds':'Round progress'}">${Array.from({length:count},(_,offset)=> {
      const i=first+offset;
      const r = results[i];
      return `<span class="step ${r ? correct(r,i) ? 'correct' : 'wrong' : i === index ? 'current' : ''}" ${i===index?'aria-current="step"':''} aria-label="Round ${i+1}${r ? correct(r,i) ? ': correct' : ': incorrect' : ''}">${r ? icon(correct(r,i)?'check':'x') : endless?icon('circle-dot'):String(i+1).padStart(2,'0')}</span>`;
    }).join('')}</div>`;
  }
  function scoreMarkup() {return `${points()}<small>${endless?' pts':confidence?'/15':'/10'}</small>`;}
  function endlessStats() {
    const wins=results.filter(correct).length;
    let streak=0;
    for(let i=results.length-1;i>=0 && correct(results[i],i);i--) streak++;
    return `<span><strong>${wins}/${results.length}</strong> CORRECT</span><span><strong>${results.length?Math.round(wins/results.length*100):0}%</strong> ACCURACY</span><span><strong>${streak}</strong> STREAK</span>`;
  }
  function player(p,side,i,slotLabel) {
    const defense = p.slot === 'DEF';
    return `<div class="player ${side === 1 ? 'right-player' : ''}" data-side="${side}" data-row="${i}">
      <div class="portrait${defense ? ' team-portrait' : ''}">${defense ? `<span class="defense">${esc(p.player_id)}</span><img src="https://sleepercdn.com/images/team_logos/nfl/${encodeURIComponent(p.player_id.toLowerCase())}.png" alt="" loading="eager" decoding="async">` : `<span class="initials">${esc(p.name.split(' ').map(n=>n[0]).slice(0,2).join(''))}</span><img src="https://sleepercdn.com/content/nfl/players/thumb/${encodeURIComponent(p.player_id)}.jpg" alt="" loading="eager" decoding="async">`}</div>
      <div class="player-info"><span class="player-name">${esc(p.name)}</span><span class="player-meta">${defense ? 'Team defense' : esc(slotLabel)}</span></div>
      <span class="player-score" aria-label="Points hidden">&mdash;</span>
    </div>`;
  }
  function render() {
    cancel();
    if (!endless && index >= 5) { summary(); return; }
    ensureRound(index);
    const r = round(); const played = results[index]; hint = played ? played.hint : hint;
    finished = !!played; revealing=false; hintMode=false;
    if(played && confidence)confidenceValue=played.confidence;
    const scoring = r.scoring.rec === 1 ? 'PPR' : r.scoring.rec === 0.5 ? 'HALF PPR' : 'STANDARD';
    const seen = {};
    const slotLabels = r.teams[0].players.map(p=> {
      const count = r.teams[0].players.filter(q=>q.slot===p.slot).length;
      seen[p.slot] = (seen[p.slot]||0)+1;
      return p.slot==='DEF' ? 'DST' : `${p.slot}${count>1 ? seen[p.slot] : ''}`;
    });
    app.innerHTML = `<section class="game-top"><div><div class="eyebrow"><span class="edition-tag">${endless?'ENDLESS':pack.mode==='daily'?'DAILY FIVE':'PRACTICE FIVE'}</span><span class="game-date">${date}</span></div><h1>Who won this matchup?</h1></div><div class="session-score"><span>${scoreMarkup()}</span><span class="score-label">YOUR POINTS</span></div></section>
      <div class="round-bar">${progress()}<span class="round-count">MATCHUP <strong>${String(index+1).padStart(2,'0')}</strong>${endless?'':' / 05'}</span></div>
      ${endless?`<div id="endless-stats" class="endless-stats">${endlessStats()}</div>`:''}
      ${pack.mode==='daily'?`<div id="daily-stats" class="daily-stats">${dailyStats()}</div>`:''}
      <section class="matchup" aria-label="Fantasy matchup">
        <div class="matchup-meta"><span class="week-label">${icon('calendar-days')} ${r.season} <span>/</span> WEEK ${r.week}</span><button class="scoring-trigger" id="scoring" aria-expanded="false" aria-controls="scoring-detail">${scoring} <span>/</span> ${r.scoring.pass_td}-PT PASS TD ${icon('info')}</button></div>
        <div id="scoring-detail" hidden>Passing: ${r.scoring.pass_yd} points/yard, ${r.scoring.pass_td}/TD, ${r.scoring.pass_int}/INT. Rushing and receiving: ${r.scoring.rush_yd} and ${r.scoring.rec_yd} points/yard; ${r.scoring.rush_td} and ${r.scoring.rec_td}/TD. Receptions: ${r.scoring.rec || 0}. <a href="${r.source.replace(/\/matchups\/\d+$/,'')}" target="_blank" rel="noopener">Full league scoring</a></div>
        <div class="scoreboard"><div class="team-head team-a"><div class="team-identity"><span class="lineup-mark" aria-hidden="true">A</span><div><span class="team-tag">${r.teams[0].players.length} STARTERS</span><h2>Lineup A</h2></div></div><div class="team-total"><span class="total" id="total-0">&mdash;</span><span class="total-label">POINTS</span></div></div><div class="versus"><span>VS</span></div><div class="team-head team-b"><div class="team-identity"><span class="lineup-mark" aria-hidden="true">B</span><div><span class="team-tag">${r.teams[1].players.length} STARTERS</span><h2>Lineup B</h2></div></div><div class="team-total"><span class="total" id="total-1">&mdash;</span><span class="total-label">POINTS</span></div></div><div id="broadcast" class="broadcast" hidden><span id="broadcast-label"></span><span id="broadcast-detail"></span></div></div>
        <div class="roster-heading" aria-hidden="true"><span><b class="lineup-dot dot-a"></b> LINEUP A <small>PTS</small></span><span>POS</span><span><b class="lineup-dot dot-b"></b> LINEUP B <small>PTS</small></span></div>
        <div class="roster">${r.teams[0].players.map((p,i)=>`<div class="paired-row" data-row="${i}">${player(p,0,i,slotLabels[i])}<button class="slot" data-hint="${i}" aria-label="Reveal both ${slotLabels[i]} scores" title="Reveal both ${slotLabels[i]} scores" disabled><span>${slotLabels[i]}</span>${icon('eye')}</button>${player(r.teams[1].players[i],1,i,slotLabels[i])}</div>`).join('')}</div>
        <div class="hint-bar"><button id="hint" class="hint-button" aria-pressed="false">${icon('scan-eye')} <span>${hint === null ? 'Use a hint' : `${slotLabels[hint]} revealed`}</span></button><span id="hint-note">${hint === null ? 'Unassisted win: 2 pts' : 'Assisted win: 1 pt'}</span></div>
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
    if(confidence) {
      document.querySelector('.edition-tag').textContent='CONFIDENCE FIVE';
      document.querySelector('.hint-bar').innerHTML=`<fieldset class="confidence-picker"><legend>Confidence</legend>${[1,2,3,4,5].map(n=>`<button type="button" data-confidence="${n}" aria-label="Confidence ${n}" aria-pressed="${confidenceValue===n}" ${played||!window.Confidence.available(results).includes(n)?'disabled':''}>${n}</button>`).join('')}</fieldset><span class="confidence-stake">${confidenceValue?confidenceValue+' points at stake':'Select a value'}</span>`;
      document.querySelectorAll('[data-confidence]').forEach(b=>b.onclick=()=>{
        confidenceValue=Number(b.dataset.confidence);save();
        document.querySelectorAll('[data-confidence]').forEach(el=>el.setAttribute('aria-pressed',String(Number(el.dataset.confidence)===confidenceValue)));
        document.querySelector('.confidence-stake').textContent=`${confidenceValue} points at stake`;
        document.querySelectorAll('[data-pick]').forEach(el=>el.disabled=false);
      });
      document.querySelectorAll('[data-pick]').forEach(b=>b.disabled=played||confidenceValue===null);
    }
    if(hint !== null) { revealRow(hint,true); document.querySelector('#hint').disabled=true; }
    if(played) { allRows(); showResult(); }
    icons();
    const next = endless?ensureRound(index+1):pack.rounds[index+1];
    if(next) next.teams.flatMap(t=>t.players).filter(p=>p.slot!=='DEF').forEach(p=>{const img=new Image();img.src=`https://sleepercdn.com/content/nfl/players/thumb/${p.player_id}.jpg`;});
  }
  function toggleHint() {
    if(confidence || hint !== null || revealing || finished) return;
    hintMode=!hintMode;
    document.querySelector('.roster').classList.toggle('choosing-hint',hintMode);
    document.querySelectorAll('[data-hint]').forEach(b=>b.disabled=!hintMode);
    document.querySelector('#hint').classList.toggle('active',hintMode);
    document.querySelector('#hint').setAttribute('aria-pressed',String(hintMode));
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
    const alreadyRevealed=row.classList.contains('revealed');
    row.classList.add('revealed'); if(assisted) row.classList.add('hinted');
    round().teams.forEach((t,s)=> {
      const score=row.querySelector(`[data-side="${s}"] .player-score`);
      score.textContent=fmt(t.players[i].points); score.setAttribute('aria-label',`${t.players[i].points} points`);
      if(!reduceMotion && !alreadyRevealed) score.animate([{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}],{duration:220,easing:'cubic-bezier(.23,1,.32,1)'});
    });
  }
  function countTotal(side,target,duration=1000) {
    const el=document.querySelector(`#total-${side}`);
    cancelAnimationFrame(totalFrames[side]);
    const start=Number.parseFloat(el.textContent) || 0; el.dataset.value=target;
    if(reduceMotion) {el.textContent=fmt(target);return;}
    const begin=performance.now();
    const tick = now=> {const p=Math.min((now-begin)/duration,1);el.textContent=fmt(start+(target-start)*(1-Math.pow(1-p,3)));if(p<1) {totalFrames[side]=requestAnimationFrame(tick);animations.push(totalFrames[side]);}};
    totalFrames[side]=requestAnimationFrame(tick);animations.push(totalFrames[side]);
  }
  function broadcast(label,detail='') {
    const el=document.querySelector('#broadcast');el.hidden=false;
    document.querySelector('#broadcast-label').textContent=label;
    document.querySelector('#broadcast-detail').textContent=detail;
    document.querySelector('#reveal-status').textContent=label;
  }
  function celebrate(win) {
    const board=document.querySelector('.scoreboard');
    board.classList.add('final-whistle');
    board.animate([{transform:'scale(1)'},{transform:'scale(1.015)'},{transform:'scale(1)'}],{duration:650,easing:'ease-out'});
    const layer=document.createElement('div');layer.className='celebration';layer.setAttribute('aria-hidden','true');document.body.append(layer);
    for(let i=0;i<44;i++) {
      const piece=document.createElement('span');layer.append(piece);
      piece.style.left=`${35+Math.random()*30}%`;
      piece.style.background=[win===0?'#6ee5c5':'#ff977f','#f2f5f3','#f4d36b'][i%3];
      const fall=piece.animate([{transform:'translate(0,0) rotate(0deg)',opacity:0},{opacity:1,offset:.08},{transform:`translate(${(Math.random()-.5)*innerWidth*.9}px,${innerHeight*.85}px) rotate(${Math.random()*700-350}deg)`,opacity:0}],{duration:1700+Math.random()*900,delay:Math.random()*160,easing:'cubic-bezier(.12,.55,.45,1)',fill:'both'});
      fall.onfinish=()=>piece.remove();
    }
    timers.push(setTimeout(()=>layer.remove(),3000));
  }
  function pick(side) {
    if(finished || revealing || results[index]) return;
    if(confidence && !window.Confidence.available(results).includes(confidenceValue))return;
    if(hintMode) toggleHint();
    results.push({pick:side,hint,...(confidence?{confidence:confidenceValue}:{})}); save(); revealing=true;
    document.querySelector('.matchup').classList.add('in-reveal');
    document.querySelector('#decision').classList.add('reveal-controls');
    document.querySelectorAll('[data-pick]').forEach(b=>{b.disabled=true;b.classList.toggle('picked',Number(b.dataset.pick)===side);});
    if(confidence)document.querySelectorAll('[data-confidence]').forEach(b=>b.disabled=true);
    else document.querySelector('#hint').disabled=true;
    document.querySelector('#decision').innerHTML=`<span class="locked">${icon('lock-keyhole')} Lineup ${labels[side]} locked in</span><button id="skip" class="text-button">Show all ${icon('fast-forward')}</button>`;
    document.querySelector('#skip').onclick=()=> {cancel();allRows();showResult();};
    broadcast('PICK LOCKED',`LINEUP ${labels[side]}`);
    if(innerWidth <= 600) {
      const qbIndex=round().teams[0].players.findIndex(p=>p.slot==='QB');
      const row=document.querySelector(`.paired-row[data-row="${Math.max(0,qbIndex)}"]`);
      const scoreboard=document.querySelector('.scoreboard');
      // Keep the starting reveal visible below the sticky scoreboard.
      window.scrollTo({top:window.scrollY+row.getBoundingClientRect().top-scoreboard.offsetHeight-8,behavior:reduceMotion?'instant':'smooth'});
    }
    const groups=['QB','RB','WR','TE','FLEX','SPECIAL TEAMS'].map(group=>({group,rows:round().teams[0].players.map((p,i)=>({p,i})).filter(({p})=>group==='SPECIAL TEAMS'?['K','DEF'].includes(p.slot):p.slot===group).map(({i})=>i)})).filter(g=>g.rows.length);
    const revealed=new Set();
    const closeFinish=Math.abs(round().teams[0].total-round().teams[1].total)<=5;
    let elapsed=900;
    // Fixed group order; only the pacing changes for close final margins.
    groups.forEach((g,j)=> {
      const last=j===groups.length-1;
      if(last && closeFinish) {
        timers.push(setTimeout(()=> {
          document.querySelector('.scoreboard').classList.add('suspense');
          broadcast('DOWN TO THE WIRE','LAST POINTS COMING IN');
        },reduceMotion?0:elapsed));
        elapsed+=2200;
      }
      const groupStart=elapsed;
      timers.push(setTimeout(()=> {
        document.querySelectorAll('.paired-row').forEach(row=>row.classList.remove('on-air'));
        g.rows.forEach(i=>document.querySelector(`.paired-row[data-row="${i}"]`).classList.add('on-air'));
        broadcast(last?'FINAL TALLY':`${g.group} ON THE BOARD`,`${j+1} / ${groups.length}`);
      },reduceMotion?0:groupStart));
      g.rows.forEach((i,k)=>timers.push(setTimeout(()=> {
        revealRow(i);revealed.add(i);
        const totals=round().teams.map(t=>t.players.reduce((sum,p,row)=>sum+(revealed.has(row)?p.points:0),0));
        totals.forEach((n,s)=>countTotal(s,n,last&&closeFinish?1600:1000));
        document.querySelectorAll('.team-head').forEach((el,s)=>el.classList.toggle('leading',totals[s]>totals[1-s]));
        if(innerWidth<=600) {
          const row=document.querySelector(`.paired-row[data-row="${i}"]`);
          const bounds=row.getBoundingClientRect();
          const top=document.querySelector('.scoreboard').getBoundingClientRect().bottom+8;
          const bottom=document.querySelector('#decision').getBoundingClientRect().top-8;
          if(bounds.top<top || bounds.bottom>bottom) window.scrollTo({top:window.scrollY+bounds.top-top,behavior:reduceMotion?'instant':'smooth'});
        }
      },reduceMotion?0:groupStart+k*(last&&closeFinish?1100:420))));
      elapsed+=last&&closeFinish?2900:Math.max(1800,(g.rows.length-1)*420+1250);
    });
    timers.push(setTimeout(()=>showResult(true),reduceMotion?30:elapsed)); icons();
  }
  function allRows() {
    round().teams[0].players.forEach((_,i)=>revealRow(i));
    round().teams.forEach((t,s)=>{const el=document.querySelector(`#total-${s}`);el.textContent=fmt(t.total);el.dataset.value=t.total;});
  }
  function showResult(withCelebration=false) {
    revealing=false;finished=true;
    document.querySelector('.matchup').classList.remove('in-reveal');
    document.querySelector('#decision').classList.remove('reveal-controls');
    const r=round(), win=winner(r), entry=results[index], ok=entry.pick===win;
    const earned=ok ? confidence?entry.confidence:entry.hint === null ? 2:1:0;
    const closeFinish=Math.abs(r.teams[0].total-r.teams[1].total)<=5;
    document.querySelector('.scoreboard').classList.remove('suspense');
    document.querySelectorAll('.paired-row').forEach(row=>row.classList.remove('on-air'));
    broadcast(`LINEUP ${labels[win]} WINS`,closeFinish?'PHOTO FINISH':'FINAL');
    const swings={};
    r.teams[win].players.forEach((p,i)=>{const group=['K','DEF'].includes(p.slot)?'special teams':p.slot;swings[group]=(swings[group]||0)+p.points-r.teams[1-win].players[i].points;});
    const [position,advantage]=Object.entries(swings).sort((a,b)=>b[1]-a[1])[0];
    allRows();
    document.querySelector('#decision').hidden=true;
    document.querySelector('#reveal-status').textContent='';
    document.querySelectorAll('.team-head').forEach((el,s)=>{el.classList.remove('leading');el.classList.toggle('winner',s===win);});
    const section=document.querySelector('#result');section.hidden=false;
    section.innerHTML=`<div class="result-icon ${ok?'success':'miss'}">${icon(ok?'check':'x')}</div><div class="result-copy"><div class="result-kicker">${ok?'GOOD CALL':'NOT THIS TIME'} <span>+${earned} ${earned===1?'PT':'PTS'}</span></div><h3>Lineup ${labels[win]} won by ${fmt(Math.abs(r.teams[0].total-r.teams[1].total))}.</h3><p>Biggest edge: ${position === 'special teams' ? position : position+' group'}, +${fmt(advantage)} points.</p><details><summary>Matchup source</summary><a href="${r.source}" target="_blank" rel="noopener">Sleeper / ${r.season} / Week ${r.week} / ${esc(r.leagueId)}</a></details></div><button id="next" class="next-button">${!endless && index===4?'See results':'Next round'} ${icon(!endless && index===4?'trophy':'chevron-right')}</button>`;
    if(!confidence)document.querySelector('#hint').disabled=true;
    document.querySelector('.session-score>span').innerHTML=scoreMarkup();
    if(endless) {
      document.querySelector('#endless-stats').innerHTML=endlessStats();
      document.querySelector('.round-bar .progress').outerHTML=progress();
    }
    if(pack.mode==='daily') {recordDaily();document.querySelector('#daily-stats').innerHTML=dailyStats();}
    document.querySelector('#next').onclick=()=>{index++;hint=null;confidenceValue=null;save();render();window.scrollTo({top:0,behavior:reduceMotion?'instant':'smooth'});};
    icons();
    if(innerWidth <= 600) section.scrollIntoView({block:'nearest',behavior:reduceMotion?'instant':'smooth'});
    if(ok && !reduceMotion) section.animate([{transform:'translateY(10px)',opacity:0},{transform:'translateY(0)',opacity:1}],{duration:260,easing:'cubic-bezier(.23,1,.32,1)'});
    if(withCelebration && !reduceMotion) {
      const winningHead=document.querySelectorAll('.team-head')[win];
      winningHead.animate([{opacity:1,transform:'translateY(0)'},{opacity:.75,transform:'translateY(-3px)'},{opacity:1,transform:'translateY(0)'}],{duration:1000});
      if(ok) celebrate(win);
    }
  }
  function confidenceSummary() {
    const wins=results.filter(correct).length;
    app.innerHTML=`<section class="summary"><div class="eyebrow">CONFIDENCE FIVE / ${season} / ${date}</div><div class="trophy">${icon('trophy')}</div><h1>${points()===15?'Perfect confidence.':wins>=3?'You know ball.':'Any given Sunday.'}</h1><div class="big-result">${points()}<span>/15</span></div><span class="summary-label">CONFIDENCE POINTS</span>${progress()}<div class="summary-stats"><div><strong>${wins}<small>/5</small></strong><span>WINNERS PICKED</span></div><div><strong>${results.filter((r,i)=>!correct(r,i)).reduce((n,r)=>n+r.confidence,0)}</strong><span>POINTS MISSED</span></div></div><div class="round-recap">${results.map((r,i)=>`<div><span class="recap-round">${i+1}</span><span>Lineup ${labels[r.pick]} ${icon(correct(r,i)?'check':'x')}</span><span>Confidence ${r.confidence}</span><strong>${earned(r,i)} pts</strong></div>`).join('')}</div><button id="share" class="share-button">${icon('share-2')} Share results</button><a class="more-button" href="${newPracticeUrl()}">Practice another five</a></section>`;
    document.querySelector('#share').onclick=async()=>{
      const text=`Sunday Split / Confidence / ${season} / ${date}\n${results.map((r,i)=>correct(r,i)?'🟩':'🟥').join('')} ${wins}/5\n${points()}/15 confidence points\nhttps://www.sundaysplit.app/?confidence=1${season===2025?'&season=2025':''}`;
      try{await navigator.clipboard.writeText(text);notify('Results copied');}catch{
        const dialog=document.createElement('dialog');dialog.innerHTML='<h2>Your results</h2><textarea aria-label="Shareable results" readonly></textarea><button>Close</button>';document.body.append(dialog);dialog.querySelector('textarea').value=text;dialog.querySelector('button').onclick=()=>dialog.remove();dialog.showModal();
      }
    };
    icons();
  }
  function summary() {
    if(confidence){confidenceSummary();return;}
    recordDaily();
    const wins=results.filter(correct).length;
    const unassisted=results.filter((r,i)=>correct(r,i)&&r.hint===null).length;
    app.innerHTML=`<section class="summary"><div class="eyebrow">${pack.mode==='daily'?'DAILY GAME':'PRACTICE SET'} COMPLETE / ${date}</div><div class="trophy">${icon('trophy')}</div><h1>${wins===5?'A perfect read.':wins>=3?'You know ball.':'Any given Sunday.'}</h1><p class="summary-sub">Five matchups. Your calls are in.</p><div class="big-result">${wins}<span>/5</span></div><span class="summary-label">WINNERS PICKED</span>${progress()}<div class="summary-stats"><div><strong>${points()}<small>/10</small></strong><span>POINTS</span></div><div><strong>${unassisted}</strong><span>UNASSISTED WINS</span></div><div><strong>${results.filter(r=>r.hint!==null).length}</strong><span>HINTS USED</span></div></div><div class="round-recap">${results.map((r,i)=>`<div><span class="recap-round">${String(i+1).padStart(2,'0')}</span><span>Lineup ${labels[r.pick]} ${icon(correct(r,i)?'check':'x')}</span><span>${r.hint===null?'Unassisted':'With hint'}</span><strong>${correct(r,i)?r.hint===null?2:1:0} pts</strong></div>`).join('')}</div><button id="share" class="share-button">${icon('share-2')} Share results</button><button id="more" class="more-button">${icon('shuffle')} Play another five</button>${pack.mode==='practice'?'<a class="text-button" href="./">Today\'s game</a>':''}<p class="prototype-note">${pack.mode==='daily'?'Next daily game: midnight Eastern.':'Practice results are separate from your daily score.'}</p></section>`;
    if(pack.mode==='daily') document.querySelector('.summary-stats').insertAdjacentHTML('afterend',`<div class="daily-stats">${dailyStats()}</div>`);
    document.querySelector('#share').onclick=async()=> {
      const text=`Sunday Split / ${pack.mode==='daily'?date:'Practice'}\n${results.map((r,i)=>correct(r,i)?'🟩':'🟥').join('')} ${wins}/5\n${points()}/10 points · ${unassisted} unassisted wins${pack.mode==='daily'?`\n${streak().current}-day streak`:''}\nhttps://www.sundaysplit.app/`;
      try {await navigator.clipboard.writeText(text);notify('Results copied');} catch {const dialog=document.createElement('dialog');dialog.innerHTML='<h2>Your results</h2><textarea aria-label="Shareable results" readonly></textarea><button>Close</button>';document.body.append(dialog);dialog.querySelector('textarea').value=text;dialog.querySelector('button').onclick=()=>dialog.remove();dialog.showModal();dialog.querySelector('textarea').select();}
    };
    document.querySelector('#more').onclick=()=>location.assign(newPracticeUrl());
    icons();
  }
  const motion=document.querySelector('#motion');
  function updateMotion() {motion.setAttribute('aria-pressed',String(reduceMotion));motion.title=reduceMotion?'Enable animations':'Reduce motion';motion.setAttribute('aria-label',motion.title);}
  motion.onclick=()=>{reduceMotion=!reduceMotion;updateMotion();notify(reduceMotion?'Reduced motion enabled':'Animations enabled');if(revealing){cancel();allRows();showResult();}};
  updateMotion();render();
  const tutorialOptions=()=>({mode:endless?'endless':confidence?'confidence':practiceSeed?'practice':'daily',reduceMotion});
  document.querySelector('#help').onclick=event=>{event.currentTarget.focus({preventScroll:true});window.SplitTutorial?.open(tutorialOptions());};
  window.SplitTutorial?.firstVisit(tutorialOptions());
})();
