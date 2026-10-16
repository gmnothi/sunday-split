(async () => {
  const load=src=>new Promise((resolve,reject)=>{
    const script=document.createElement('script');script.src=src;
    script.onload=resolve;script.onerror=()=>reject(new Error('Unable to load game data'));
    document.head.append(script);
  });
  try {
    if(window.GameLinks.invalid)throw new Error('Invalid challenge link');
    if(window.GameLinks.incoming?.season===2025){const url=new URL(location.href);url.searchParams.set('season','2025');history.replaceState(null,'',url);}
    const league=new URLSearchParams(location.search).get('league');
    if(league){
      document.querySelector('.summary-sub').textContent='Loading your completed Sleeper matchups...';
      window.CUSTOM_POOL=await window.SleeperImport.load(league);
      const url=new URL(location.href);url.searchParams.set('season',window.CUSTOM_POOL.rounds[0].season);if(!window.GameLinks.incoming&&!url.searchParams.has('practice'))url.searchParams.set('practice','league-'+league);history.replaceState(null,'',url);
      const clues=window.LINEUP_CLUES?.[window.CUSTOM_POOL.rounds[0].season];
      if(clues){const matching=window.MATCHUP_POOL.rounds.find(r=>JSON.stringify(r.scoring)===JSON.stringify(window.CUSTOM_POOL.rounds[0].scoring));if(matching&&clues.formats[matching.leagueId])clues.formats[league]=clues.formats[matching.leagueId];}
    }
    if(new URLSearchParams(location.search).get('season')==='2025') {
      document.querySelector('.summary-sub').textContent='Loading 2025 matchups...';
      await load('data-2025.js');
    }
    const season=new URLSearchParams(location.search).get('season')==='2025'?2025:2026;
    window.GameLinks.resolve(window.CUSTOM_POOL||(season===2025?window.MATCHUP_POOL_2025:window.MATCHUP_POOL));
    try {await load('curation.js');}catch { /* Fall back to the original pool order. */ }
    try {await load(`clues-${season}.js`);}catch { /* A missing clue pack must not prevent playing. */ }
    await load('app.js');
  }catch {
    document.querySelector('#app').innerHTML='<section class="summary"><h1>Game unavailable</h1><p>Check your connection and reload.</p><button onclick="location.reload()">Retry</button></section>';
  }
})();
