(() => {
  const values=[1,2,3,4,5];
  const available=results=>values.filter(n=>!results.some(r=>r.confidence===n));
  const valid=results=>results.length<=5 && results.every(r=>values.includes(r.confidence)&&r.hint===null) && new Set(results.map(r=>r.confidence)).size===results.length;
  const earned=(entry,correct)=>correct?entry.confidence:0;
  window.Confidence={available,valid,earned};
})();
