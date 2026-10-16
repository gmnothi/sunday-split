(() => {
  const encode=value=>btoa(JSON.stringify(value)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  function decode(token) {
    try {
      if(typeof token!=='string'||token.length>6000||!/^[\w-]+$/.test(token))return null;
      const value=JSON.parse(atob(token.replace(/-/g,'+').replace(/_/g,'/')));
      if(value.v!==1||![2025,2026].includes(value.season)||![1,5].includes(value.keys?.length)||new Set(value.keys).size!==value.keys.length||value.keys.some(k=>typeof k!=='string'||!/^\d{15,22}:\d{1,2}:\d+$/.test(k))||!Array.isArray(value.flips)||value.flips.length!==value.keys.length||value.flips.some(f=>![0,1].includes(f)))return null;
      return value;
    }catch{return null;}
  }
  const token=new URLSearchParams(location.hash.slice(1)).get('play');
  const incoming=decode(token);
  function resolve(pool) {
    if(!incoming)return null;
    const rounds=incoming.keys.map((key,i)=>{
      const r=pool.rounds.find(r=>r.key===key);
      return r?{...r,teams:incoming.flips[i]?[...r.teams].reverse():[...r.teams]}:null;
    });
    if(rounds.some(r=>!r))throw new Error('This challenge is not in the available matchup pool.');
    return {id:'shared:'+token,mode:rounds.length===1?'grudge':'challenge',rounds};
  }
  function url(rounds,pool,base=location.href) {
    const value={v:1,season:rounds[0].season,keys:rounds.map(r=>r.key),flips:rounds.map(r=>{
      const original=pool.rounds.find(p=>p.key===r.key);
      if(!original)throw new Error('Matchup is not shareable');
      return original.teams[0].total===r.teams[0].total?0:1;
    })};
    const link=new URL(base);link.search='';if(value.season===2025)link.searchParams.set('season','2025');link.hash='play='+encode(value);return link.href;
  }
  window.GameLinks={decode,incoming,resolve,url,invalid:!!token&&!incoming};
})();
