(() => {
  const day=value=> {
    if(typeof value!=='string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const time=Date.parse(value+'T00:00:00Z');
    return Number.isFinite(time) && new Date(time).toISOString().slice(0,10)===value ? time/86400000 : null;
  };
  function stats(completed,today) {
    const now=day(today);
    if(now===null) throw new RangeError('Invalid streak date');
    const days=[...new Set((Array.isArray(completed)?completed:[]).map(day).filter(n=>n!==null && n<=now))].sort((a,b)=>a-b);
    let best=0,run=0,previous=null;
    for(const d of days) {run=d===previous+1?run+1:1;best=Math.max(best,run);previous=d;}
    const set=new Set(days);
    let cursor=set.has(now)?now:now-1,current=0;
    while(set.has(cursor)) {current++;cursor--;}
    return {current,best,completed:days.length,dates:days.map(d=>new Date(d*86400000).toISOString().slice(0,10))};
  }
  window.DailyStreaks={stats};
})();
