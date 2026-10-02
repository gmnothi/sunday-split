(async () => {
  const load=src=>new Promise((resolve,reject)=>{
    const script=document.createElement('script');script.src=src;
    script.onload=resolve;script.onerror=()=>reject(new Error('Unable to load game data'));
    document.head.append(script);
  });
  try {
    if(new URLSearchParams(location.search).get('season')==='2025') {
      document.querySelector('.summary-sub').textContent='Loading 2025 matchups...';
      await load('data-2025.js');
    }
    const season=new URLSearchParams(location.search).get('season')==='2025'?2025:2026;
    try {await load('curation.js');}catch { /* Fall back to the original pool order. */ }
    try {await load(`clues-${season}.js`);}catch { /* A missing clue pack must not prevent playing. */ }
    await load('app.js');
  }catch {
    document.querySelector('#app').innerHTML='<section class="summary"><h1>Game unavailable</h1><p>Check your connection and reload.</p><button onclick="location.reload()">Retry</button></section>';
  }
})();
