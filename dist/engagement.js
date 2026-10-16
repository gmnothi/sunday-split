(() => {
  const {dialog,button,esc,share}=window.SplitSocial;
  const request=(...args)=>window.LeagueRooms.request(...args);
  async function profile(action){try{if((await request('session')).name)await action();else window.LeagueRooms.nickname(action);}catch(error){dialog('Shared play unavailable',`<p>${esc(error.message)}</p>`);}}
  function savedChallenges(){try{const rows=JSON.parse(localStorage.getItem('sunday-split:creator-links'));return Array.isArray(rows)?rows.filter(r=>r&&typeof r.url==='string'&&r.created>Date.now()-30*86400000).slice(-12):[];}catch{return [];}}
  function openCreator(d) {
    if(!d?.pool||d.pool.custom){dialog('Creator challenges','<p>Open a published season to curate a weekly five.</p>');return;}
    const rounds=d.pool.rounds,initial=d.pack.rounds.length>=5?d.pack.rounds.slice(0,5):window.GamePacks.makePack(d.pool,{date:d.date,practiceSeed:'creator-'+d.date}).rounds;
    const el=dialog('Your weekly challenge',`<form id="creator-form"><label>Challenge title<input name="title" required maxlength="60" placeholder="Your weekly five"></label><p class="social-note">Community-created, not a verified creator endorsement. Five published matchups; your score appears only after you play and submit.</p><div class="creator-picks"></div><button type="submit" class="social-button"><i data-lucide="megaphone" aria-hidden="true"></i> Create challenge</button><p role="status" class="social-status"></p></form><details class="creator-history"><summary>Your recent challenge links</summary><div></div></details>`);
    const saved=savedChallenges(),history=el.querySelector('.creator-history div');
    if(!saved.length)history.textContent='No saved links on this device.';
    saved.reverse().forEach(r=>{const a=document.createElement('a');a.className='extras-link';a.href=r.url;a.textContent=r.title;history.append(a);});
    const fields=el.querySelector('.creator-picks'),weeks=[...new Set(rounds.map(r=>r.week))].sort((a,b)=>b-a);
    for(let i=0;i<5;i++){
      const row=document.createElement('div');row.innerHTML=`<label>Round ${i+1} week<select class="creator-week" aria-label="Round ${i+1} week">${weeks.map(w=>`<option value="${w}">${d.round?.season||rounds[0].season} / Week ${w}</option>`).join('')}</select></label><label>Matchup<select name="round" required aria-label="Round ${i+1} matchup"></select></label>`;fields.append(row);
      const week=row.querySelector('.creator-week'),select=row.querySelector('[name=round]');week.value=String(initial[i]?.week||weeks[0]);
      const fill=()=>{select.innerHTML='';rounds.filter(r=>r.week===Number(week.value)).forEach(r=>{const o=document.createElement('option');o.value=r.key;o.textContent=`${r.teams[0].players[0].name} vs ${r.teams[1].players[0].name} / league ${r.leagueId.slice(-5)} / ${r.key.split(':').at(-1)}`;select.append(o);});};fill();if(initial[i])select.value=initial[i].key;week.onchange=fill;
    }
    el.querySelector('#creator-form').onsubmit=async event=>{
      event.preventDefault();const submit=el.querySelector('[type=submit]'),status=el.querySelector('[role=status]');
      const keys=[...el.querySelectorAll('[name=round]')].map(s=>s.value);
      if(new Set(keys).size!==5){status.textContent='Choose five different matchups.';return;}
      const performances=new Set();
      for(const key of keys)for(const t of rounds.find(r=>r.key===key).teams)for(const p of t.players){const id=key.split(':')[1]+':'+p.player_id;if(performances.has(id)){status.textContent='A player repeats in the same week. Mix the weeks or lineups to avoid giving away a later answer.';return;}performances.add(id);}
      submit.disabled=true;
      await profile(async()=>{
        try{
          const room=await request('rooms',{method:'POST',body:{v:1,season:rounds[0].season,keys,flips:[0,0,0,0,0],title:el.querySelector('[name=title]').value.trim()}});
          const url=new URL(location.origin+'/');url.searchParams.set('room',room.id);url.hash='play='+room.token;
          const rows=savedChallenges();rows.push({title:room.title,url:url.href,created:Date.now()});try{localStorage.setItem('sunday-split:creator-links',JSON.stringify(rows.slice(-12)));}catch{}
          el.close();const ready=dialog(room.title,`<p>Week of ${esc(room.week)}. Your five are ready.</p><p class="social-note">Anyone with the link can play. Standings unlock after submitting five picks. Links last 30 days.</p><a class="extras-link" href="${esc(url.href)}">Play your challenge</a>`);ready.querySelector('.dialog-body').append(button('Share challenge','share-2',()=>share('Take on my weekly five: '+room.title,url.href,'creator_challenge')));window.lucide?.createIcons();
        }catch(error){status.textContent=error.message;}finally{submit.disabled=false;}
      });
      submit.disabled=false;
    };
    window.lucide?.createIcons();
  }
  function openRivalries(){profile(async()=>{
    const data=await request('rivalries');
    const html=data.rivals.length?data.rivals.map(r=>`<section class="rivalry-row"><h3>${esc(r.name)}</h3><p>You ${r.yourWins} / Them ${r.theirWins} / Tied ${r.ties}</p><p>${r.sets} shared sets.</p>${r.comparedSets?`<p>${r.disagreements} picks you disagreed on across ${r.comparedSets} sets with pick history; you got ${r.yourCalls} right, they got ${r.theirCalls}.</p>`:'<p>Pick-level history unavailable for these older submissions.</p>'}</section>`).join(''):'<p>No rivalries yet. Finish a league challenge with a friend to start a head-to-head record.</p>';
    dialog('League rivalries',html+`<p class="social-note">${esc(data.window)} Old score-only submissions have no disagreement breakdown. Nicknames are not verified identities; no friend directory is published.</p>`);
  });}
  function specFor(d){const url=new URL(window.GameLinks.url(d.pack.rounds,d.pool));return window.GameLinks.decode(new URLSearchParams(url.hash.slice(1)).get('play'));}
  function debrief(d){profile(async()=>{
    const data=await request('debrief',{method:'POST',body:{...specFor(d),picks:d.results.map(r=>r.pick)}});
    const el=dialog('Monday Debrief',`<p class="social-note">This completed set, refreshed on demand. Opening it submits your five picks to the community tally. Samples count browser profiles, not verified people; earlier votes are kept.</p>${data.rounds.map(r=>`<section class="debrief-round"><h3>Round ${r.index+1}</h3>${r.total<5?`<p>${r.total} pick${r.total===1?'':'s'} so far. Percentages unlock at five.</p>`:`<p>${r.pickedA}% picked A / ${100-r.pickedA}% picked B</p><p><strong>${r.winnerShare}% found the winner.</strong></p>`}</section>`).join('')}`);
    el.querySelector('.dialog-body').append(button('Refresh','refresh-cw',()=>{el.close();debrief(d);}));window.lucide?.createIcons();
  });}
  document.addEventListener('split:round',()=>{const room=window.LeagueRooms.active;if(room?.title){document.querySelector('h1').textContent=room.title;const p=document.createElement('p');p.className='social-note';p.textContent=`Community challenge / week of ${room.week}`;document.querySelector('.game-top>div').append(p);}});
  document.addEventListener('split:complete',({detail:d})=>{
    if(d.pack.rounds.length!==5||d.confidence||d.variant||d.pool.custom)return;
    document.querySelector('.summary')?.append(button('Monday Debrief','message-square',()=>{
      const el=dialog('Open the debrief?','<p>Add your five picks to the real community tally and see where this set split opinion.</p>');el.querySelector('.dialog-body').append(button('Add picks & see recap','chart-no-axes-combined',()=>{el.close();debrief(d);}));window.lucide?.createIcons();
    }));
  });
  window.SplitCreators={open:openCreator};window.SplitRivalries={open:openRivalries};
})();
