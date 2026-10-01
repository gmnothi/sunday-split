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
  function makePack(pool,{date,practiceSeed=null,excluded=[],savedKeys=null}) {
    const mode=practiceSeed?'practice':'daily';
    const id=`${mode}:${practiceSeed||date}:${pool.version}`;
    const rng=random(id);
    const excludedSet=new Set(excluded);
    const available=shuffle(pool.rounds.filter(r=>!excludedSet.has(r.key)),rng);
    const selected=[];
    const restoring=savedKeys && savedKeys.length===5 && new Set(savedKeys).size===5 && savedKeys.every(key=>pool.rounds.some(r=>r.key===key));
    if(restoring) {
      selected.push(...savedKeys.map(key=>pool.rounds.find(r=>r.key===key)));
    } else {
      // A varied set: one of each margin class, then a fifth distinct matchup.
      for(const category of ['close_winner','competitive_win','comfortable_win','blowout']) {
        const r=available.find(r=>r.resultClass===category && !selected.includes(r));
        if(r) selected.push(r);
      }
      selected.push(...available.filter(r=>!selected.includes(r)).slice(0,5-selected.length));
      if(selected.length<5) selected.push(...shuffle(pool.rounds.filter(r=>!selected.includes(r)),rng).slice(0,5-selected.length));
    }
    const ordered=restoring ? selected : shuffle(selected,rng);
    return {id,mode,date,rounds:ordered.map(r=>({...r,teams:random(id+':'+r.key)()<.5?[...r.teams]:[...r.teams].reverse()}))};
  }
  function endlessRound(pool,seed,index) {
    if(!Number.isSafeInteger(index) || index<0 || !pool.rounds.length) throw new RangeError('Invalid endless round');
    const id=`endless:${seed}:${pool.version}`;
    const cycle=Math.floor(index/pool.rounds.length);
    const order=shuffle(pool.rounds,random(id+':cycle:'+cycle));
    // Keep a reshuffle from immediately repeating the previous cycle's last matchup.
    if(cycle>0 && order.length>2) {
      const previous=shuffle(pool.rounds,random(id+':cycle:'+(cycle-1)));
      if(order[0].key===previous.at(-1).key) [order[0],order[1]]=[order[1],order[0]];
    }
    const r=order[index%order.length];
    return {...r,teams:random(id+':round:'+index)()<.5?[...r.teams]:[...r.teams].reverse()};
  }
  window.GamePacks={makePack,endlessRound};
})();
