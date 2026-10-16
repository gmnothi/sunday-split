(() => {
  const {esc,dialog,button}=window.SplitSocial;
  let current=null;
  const remaining=round=>round.teams[0].players.map((p,i)=>({p,i})).filter(({p})=>!['K','DEF'].includes(p.slot)).slice(-2).map(({i})=>i);
  function blindPlayer(p,side,i,slot,round) {
    const clue=window.PlayerClues?.player(round,p.player_id),o=clue?.opponent;
    return `<div class="player ${side?'right-player':''}" data-side="${side}" data-row="${i}" data-blind><div class="portrait blind-portrait" aria-hidden="true"><i data-lucide="user-round"></i></div><div class="player-info"><span class="player-name">${esc(slot)}</span><span class="player-meta">Mystery starter</span><span class="player-matchup">${o?esc(`${o.team} ${o.home?'vs':'@'} ${o.opponent}`):'Opponent unavailable'}</span><span class="player-form">${clue?.games.length?`<b>${clue.average.toFixed(2)}</b> L${clue.games.length}G ${window.FormTrend.markup(clue.games)}`:'AVG UNAVAILABLE'}</span></div><span class="player-score" aria-label="Points hidden">&mdash;</span></div>`;
  }
  function identityPlayer(p,side,i) {
    const defense=p.slot==='DEF',src=defense?`https://sleepercdn.com/images/team_logos/nfl/${encodeURIComponent(p.player_id.toLowerCase())}.png`:`https://sleepercdn.com/content/nfl/players/thumb/${encodeURIComponent(p.player_id)}.jpg`;
    return `<div class="player ${side?'right-player':''}" data-side="${side}" data-row="${i}"><div class="portrait${defense?' team-portrait':''}"><span class="initials">${esc(p.name.slice(0,2))}</span><img src="${src}" alt="" decoding="async"></div><div class="player-info"><span class="player-name">${esc(p.name)}</span><span class="player-meta">${esc(p.slot)}</span></div><span class="player-score" aria-label="Points hidden">&mdash;</span></div>`;
  }
  const modeUrl=mode=>{const url=new URL(location.href);url.search='';url.hash='';if(current?.round?.season===2025)url.searchParams.set('season','2025');if(mode)url.searchParams.set('mode',mode);return url.href;};
  function openHub() {
    const el=dialog('More Sunday Split','<nav class="extras-menu" aria-label="More games"></nav><div class="extras-tools"></div>'),nav=el.querySelector('nav'),tools=el.querySelector('.extras-tools');
    const link=(name,icon,href)=>{const a=document.createElement('a');a.className='extras-link';a.href=href;a.innerHTML=`<i data-lucide="${icon}" aria-hidden="true"></i><span>${esc(name)}</span>`;nav.append(a);};
    link('Fourth Quarter','timer',modeUrl('fourth-quarter'));link('Blind Resume','fingerprint',modeUrl('blind'));
    for(const id of ['practice-nav','confidence-nav']){const a=document.querySelector('#'+id);if(a)link(a.textContent,id==='practice-nav'?'shuffle':'gauge',a.href);}
    const action=(name,icon,fn)=>tools.append(button(name,icon,()=>{el.close();fn();}));
    action('Weekly recap','calendar-range',()=>window.SplitWrapped.open());
    action('Bring your league','users-round',()=>window.BringLeague.open());
    action('Creator challenge','megaphone',()=>window.SplitCreators.open(current));
    action('League rivalries','swords',()=>window.SplitRivalries.open());
    action('How to play','circle-help',()=>document.querySelector('#help').click());
    action('Animation preference','sparkles',()=>document.querySelector('#motion').click());
    window.lucide?.createIcons();
  }
  function mount(d) {
    current=d;
    for(const selector of ['#practice-nav','#confidence-nav','#help','#motion','[data-wrapped]','[data-bring-league]']){const el=document.querySelector(selector);if(el)el.hidden=true;}
    if(!document.querySelector('#extras-menu')){
      const b=button('More','ellipsis',openHub);b.id='extras-menu';b.className='extras-nav';document.querySelector('.mode-nav').append(b);
    }
    const b=document.querySelector('#extras-menu');if(d.variant||d.confidence||d.pack.mode==='practice')b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');
  }
  function tidy(container,label) {
    if(!container)return;
    const actions=[...container.querySelectorAll(':scope > .social-button')];
    if(!actions.length)return;
    let details=container.querySelector(':scope > .extra-actions');
    if(!details){details=document.createElement('details');details.className='extra-actions';details.innerHTML=`<summary>${esc(label)}</summary><div class="social-toolbar"></div>`;container.append(details);}
    actions.forEach(b=>details.querySelector('.social-toolbar').append(b));
  }
  const caseKey=d=>'sunday-split:case:'+d.pack.id+':'+d.index;
  function readCase(d){try{return JSON.parse(localStorage.getItem(caseKey(d)));}catch{return null;}}
  function writeCase(d,value){try{localStorage.setItem(caseKey(d),JSON.stringify(value));}catch{}}
  function caseOutcome(round,choice) {
    if(!choice||![0,1].includes(choice.side)||!Number.isInteger(choice.row)||!round.teams[choice.side].players[choice.row])return null;
    const win=round.teams[0].total>round.teams[1].total?0:1;
    const edges=round.teams[win].players.map((p,i)=>p.points-round.teams[1-win].players[i].points),max=Math.max(...edges);
    return choice.side===win&&Math.abs(edges[choice.row]-max)<.005;
  }
  function casePicker(d,b) {
    const choice=readCase(d),el=dialog('Call the difference-maker','<p class="social-note">Optional side call: which winning-lineup starter will have the biggest points edge over the opposite slot? Does not change your score.</p><fieldset class="case-options"><legend>Starter</legend></fieldset>');
    const fields=el.querySelector('fieldset');
    d.round.teams.forEach((t,side)=>t.players.forEach((p,row)=>{
      const label=document.createElement('label'),input=document.createElement('input');input.type='radio';input.name='difference-maker';input.checked=choice?.side===side&&choice?.row===row;
      label.append(input,document.createTextNode(`${side?'B':'A'} / ${p.name} / ${p.slot}`));fields.append(label);
      input.onchange=()=>{writeCase(d,{side,row,locked:false});b.querySelector('span').textContent='Side call: '+p.name;el.close();};
    }));
    el.querySelector('.dialog-body').append(button('No side call','x',()=>{try{localStorage.removeItem(caseKey(d));}catch{}b.querySelector('span').textContent='Call a difference-maker';el.close();}));
  }
  document.addEventListener('split:round',({detail:d})=>{
    mount(d);
    if(!d.played&&!d.variant){const choice=readCase(d),b=button(choice?`Side call: ${d.round.teams[choice.side]?.players[choice.row]?.name||'starter'}`:'Call a difference-maker','crosshair',()=>casePicker(d,b));b.className='case-trigger social-button';document.querySelector('.hint-bar')?.after(b);window.lucide?.createIcons();}
  });
  document.addEventListener('split:pick',({detail:d})=>{const choice=readCase(d);if(choice){writeCase(d,{...choice,locked:true});}document.querySelector('.case-trigger')?.remove();});
  document.addEventListener('split:reveal',({detail:d})=>{
    const choice=readCase(d),outcome=caseOutcome(d.round,choice),section=document.querySelector('#result');
    if(choice?.locked&&outcome!==null){const p=document.createElement('p');p.className='case-outcome';p.textContent=`Side call: ${d.round.teams[choice.side].players[choice.row].name} / ${outcome?'Difference-maker called.':'Not the biggest winning-slot edge.'}`;section.append(p);}
    queueMicrotask(()=>tidy(section,'Postgame'));
  });
  document.addEventListener('split:complete',({detail:d})=>{mount(d);queueMicrotask(()=>tidy(document.querySelector('.summary'),'League & community'));});
  window.SplitExtras={remaining,blindPlayer,identityPlayer,caseOutcome,openHub};
})();
