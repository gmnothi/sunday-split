(() => {
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function track(event,detail={}) { (window.dataLayer||=[]).push({event:'split_'+event,...detail}); }
  function dialog(title,html) {
    const el=document.createElement('dialog');el.className='social-dialog';el.innerHTML=`<form method="dialog"><button class="icon-button dialog-close" aria-label="Close" title="Close"><i data-lucide="x"></i></button></form><h2>${esc(title)}</h2><div class="dialog-body">${html}</div>`;
    document.body.append(el);el.addEventListener('close',()=>el.remove(),{once:true});el.addEventListener('click',e=>{if(e.target===el){const b=el.getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)el.close();}});el.showModal();window.lucide?.createIcons();return el;
  }
  async function share(text,url,kind) {
    track('share_attempt',{kind});
    try {
      if(navigator.share){await navigator.share({title:'Sunday Split',text,url});track('share_sheet_completed',{kind});return;}
      await navigator.clipboard.writeText(text+'\n'+url);track('link_copied',{kind});dialog('Challenge copied','<p>Ready for your league chat.</p>');
    }catch(error){if(error.name==='AbortError')return;const el=dialog('Share challenge','<textarea readonly aria-label="Challenge link"></textarea>');el.querySelector('textarea').value=text+'\n'+url;}
  }
  function button(label,icon,action) {
    const b=document.createElement('button');b.type='button';b.className='social-button';b.innerHTML=`<i data-lucide="${icon}" aria-hidden="true"></i><span>${esc(label)}</span>`;b.onclick=action;return b;
  }
  const seen=new Set();
  function once(key,fn){if(seen.has(key))return;try{if(localStorage.getItem('sunday-split:metric:'+key))return;localStorage.setItem('sunday-split:metric:'+key,'1');}catch{}seen.add(key);fn();}
  function iconButton(label,icon,action){const b=button(label,icon,action);b.className='icon-button';b.title=label;b.setAttribute('aria-label',label);b.querySelector('span').remove();return b;}
  window.SplitSocial={esc,dialog,share,track,button,iconButton};
  document.addEventListener('split:reveal',({detail:d})=>{
    if(d.variant)return;
    const result=document.querySelector('#result');if(result&&!result.querySelector('[data-grudge]')){
      const b=button('Challenge a friend','swords',()=>share('Who are you taking? Pick before the reveal.',window.GameLinks.url([d.round],d.pool),'grudge'));b.dataset.grudge='';result.append(b);window.lucide?.createIcons();
    }
  });
  document.addEventListener('split:pick',({detail:d})=>{if(d.index===0)once('pick:'+d.pack.id,()=>track('first_pick',{mode:d.pack.mode,season:d.round.season}));});
  document.addEventListener('split:complete',({detail:d})=>{
    once('finish:'+d.pack.id,()=>track('finish',{mode:d.pack.mode,rounds:d.results.length}));
    if(d.variant)return;
    const summary=document.querySelector('.summary');
    if(summary&&!summary.querySelector('[data-beat]')){
      const wins=d.results.filter((r,i)=>r.pick===(d.pack.rounds[i].teams[0].total>d.pack.rounds[i].teams[1].total?0:1)).length;
      const b=button(`Beat my ${wins}/${d.results.length}`,'swords',()=>share(`I got ${wins}/${d.results.length}. Beat my score on these exact matchups.`,window.GameLinks.url(d.pack.rounds,d.pool),'beat_score'));b.dataset.beat='';summary.querySelector('#share')?.after(b);window.lucide?.createIcons();
    }
  });
})();
