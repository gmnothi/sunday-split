(() => {
  function hash(text) {
    let h=2166136261;
    for(const c of text) h=Math.imul(h^c.charCodeAt(0),16777619);
    return h>>>0;
  }
  function random(seed) {
    let state=hash(seed);
    return ()=> {state=(state+0x6D2B79F5)>>>0;let t=state;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};
  }
  function shuffle(items,rng) {
    const result=[...items];
    for(let i=result.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[result[i],result[j]]=[result[j],result[i]];}
    return result;
  }
  function makePack(pool,{date,practiceSeed=null,excluded=[],savedKeys=null,freezeDaily=false}) {
    const mode=practiceSeed?'practice':'daily';
    if((mode==='daily'||freezeDaily) && pool.dailyExpansionDate && date<pool.dailyExpansionDate && pool.legacyRoundKeys?.length) {
      const legacy=new Set(pool.legacyRoundKeys);
      pool={...pool,rounds:pool.rounds.filter(r=>legacy.has(r.key))};
    }
    if(mode==='daily'||freezeDaily) {
      const snapshot=(pool.dailySnapshots||[]).find(s=>date<s.before);
      if(snapshot) {const keys=new Set(snapshot.keys);pool={...pool,rounds:pool.rounds.filter(r=>keys.has(r.key))};}
    }
    const id=`${mode}:${practiceSeed||date}:${pool.version}`;
    const rng=random(id);
    const excludedSet=new Set(excluded);
    const curation=(mode==='daily'||freezeDaily)?(window.MATCHUP_CURATION?.dailySnapshots||[]).find(s=>date<s.before)||window.MATCHUP_CURATION:window.MATCHUP_CURATION;
    const curated=curation && (mode!=='daily'&&!freezeDaily || date>=curation.dailyFrom);
    const available=curated?weightedOrder(pool.rounds.filter(r=>!excludedSet.has(r.key)),rng,curation):shuffle(pool.rounds.filter(r=>!excludedSet.has(r.key)),rng);
    const selected=[];
    const restoring=savedKeys && savedKeys.length===5 && new Set(savedKeys).size===5 && savedKeys.every(key=>pool.rounds.some(r=>r.key===key));
    if(restoring) {
      selected.push(...savedKeys.map(key=>pool.rounds.find(r=>r.key===key)));
    } else {
      // Keep already-played daily games intact; favor suspense in new sets.
      const categories=mode==='daily' && date<'2026-10-02'
        ? ['close_winner','competitive_win','comfortable_win','blowout']
        : ['close_winner','close_winner','competitive_win','competitive_win','comfortable_win'];
      for(const category of categories) {
        const candidates=available.filter(r=>r.resultClass===category && !selected.includes(r));
        const featured=curated && selected.length<3?candidates.find(r=>curation.seasons[r.season]?.[r.key]):null;
        const r=featured||candidates[0];
        if(r) selected.push(r);
      }
      selected.push(...available.filter(r=>!selected.includes(r)).slice(0,5-selected.length));
      if(selected.length<5) selected.push(...shuffle(pool.rounds.filter(r=>!selected.includes(r)),rng).slice(0,5-selected.length));
    }
    const ordered=restoring ? selected : shuffle(selected,rng);
    return {id,mode,date,rounds:ordered.map(r=>({...r,teams:random(id+':'+r.key)()<.5?[...r.teams]:[...r.teams].reverse()}))};
  }
  function weightedOrder(rounds,rng,curation=window.MATCHUP_CURATION) {
    return rounds.map(r=>({r,rank:-Math.log(Math.max(rng(),Number.MIN_VALUE))/(curation?.seasons[r.season]?.[r.key]||1)})).sort((a,b)=>a.rank-b.rank).map(item=>item.r);
  }
  const orders=new WeakMap();
  function cycleOrder(pool,id,cycle) {
    let cache=orders.get(pool);if(!cache){cache=new Map();orders.set(pool,cache);}
    const key=id+':'+cycle;
    if(!cache.has(key)) {
      const rng=random(id+':cycle:'+cycle);
      cache.set(key,window.MATCHUP_CURATION?weightedOrder(pool.rounds,rng):shuffle(pool.rounds,rng));
      if(cache.size>32)cache.delete(cache.keys().next().value);
    }
    return [...cache.get(key)];
  }
  function endlessRound(pool,seed,index) {
    if(!Number.isSafeInteger(index) || index<0 || !pool.rounds.length) throw new RangeError('Invalid endless round');
    const id=`endless:${seed}:${pool.version}`;
    const cycle=Math.floor(index/pool.rounds.length);
    const order=cycleOrder(pool,id,cycle);
    // Keep a reshuffle from immediately repeating the previous cycle's last matchup.
    if(cycle>0 && order.length>2) {
      const previous=cycleOrder(pool,id,cycle-1);
      if(order[0].key===previous.at(-1).key) [order[0],order[1]]=[order[1],order[0]];
    }
    const r=order[index%order.length];
    return {...r,teams:random(id+':round:'+index)()<.5?[...r.teams]:[...r.teams].reverse()};
  }
  window.GamePacks={makePack,endlessRound};
})();
