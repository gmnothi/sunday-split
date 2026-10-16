(() => {
  function open() {
    const {dialog,button}=window.SplitSocial;
    const el=dialog('Bring your league','<form id="league-import"><label>Sleeper league ID<input name="league" inputmode="numeric" pattern="[0-9]{15,22}" required maxlength="22" autocomplete="off"></label><p class="social-note">Completed matchups only. Ten-team, one-QB leagues from 2025 or 2026. Manager names and contact details are not imported.</p><p class="social-note">Some custom scoring formats may not have recent-form clues.</p><button type="submit" class="social-button">Load league</button><p class="social-status" role="status"></p></form>');
    el.querySelector('form#league-import').onsubmit=async event=>{
      event.preventDefault();const input=el.querySelector('input'),submit=el.querySelector('[type=submit]'),status=el.querySelector('[role=status]');submit.disabled=true;input.disabled=true;
      try{const pool=await window.SleeperImport.load(input.value.trim(),fetch,(week,total)=>{status.textContent=`Loading completed week ${week}/${total}...`;});try{sessionStorage.setItem('sunday-split:league:'+pool.leagueId,JSON.stringify(pool));}catch{}const url=new URL(location.href);url.search='';url.hash='';url.searchParams.set('league',pool.leagueId);url.searchParams.set('season',pool.rounds[0].season);url.searchParams.set('practice',crypto.randomUUID());location.assign(url);}catch(error){status.textContent=error.message;status.classList.add('social-error');submit.disabled=false;input.disabled=false;}
    };
  }
  function mount(){const header=document.querySelector('.header-right');if(header&&!header.querySelector('[data-bring-league]')){const b=window.SplitSocial.button('Your league','users-round',open);b.dataset.bringLeague='';header.append(b);window.lucide?.createIcons();}}
  document.addEventListener('split:round',mount);document.addEventListener('split:complete',mount);
  window.BringLeague={open};
})();
