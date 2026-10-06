(() => {
  function model(games) {
    if(!Array.isArray(games)||!games.length||games.length>3||games.some(g=>!Number.isFinite(g.points)||!Number.isInteger(g.season)||!Number.isInteger(g.week)))return null;
    const ordered=[...games].sort((a,b)=>a.season-b.season||a.week-b.week);
    const values=ordered.map(g=>g.points);
    const delta=values.at(-1)-values[0];
    const direction=values.length<2?'limited':Math.abs(delta)<.005?'flat':delta>0?'up':'down';
    // A 40-point minimum range keeps tiny differences from looking dramatic.
    const low=Math.min(0,...values),high=Math.max(40,...values);
    const points=values.map((n,i)=>({x:values.length===1?24:3+i*42/(values.length-1),y:17-(n-low)/(high-low)*14}));
    return {ordered,values,delta,direction,points};
  }
  function markup(games) {
    const m=model(games);if(!m)return '';
    const label=m.direction==='limited'?'One prior game; no trend yet':m.direction==='flat'?'Flat: latest and oldest prior scores match':`${m.direction==='up'?'Up':'Down'} ${Math.abs(m.delta).toFixed(2)} points from oldest to latest prior game`;
    const history=m.ordered.map(g=>`${g.season} W${g.week}: ${g.points.toFixed(2)} pts`).join('; ');
    return `<svg class="form-sparkline" data-trend="${m.direction}" viewBox="0 0 48 20" role="img" aria-label="${label}. ${history}."><title>${label}. Oldest to latest: ${history}.</title><path class="sparkline-baseline" d="M3 17H45"/><polyline points="${m.points.map(p=>`${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ')}"/>${m.points.map((p,i)=>`<circle cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" r="${i===m.points.length-1?2.2:1.6}"/>`).join('')}</svg>`;
  }
  window.FormTrend={model,markup};
})();
