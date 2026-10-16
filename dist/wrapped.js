(() => {
  const key='sunday-split:history:v1';
  const day=now=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Toronto',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
  function summarize(records,today) {
    const end=Date.parse(today+'T00:00:00Z'),start=end-6*86400000;
    const rows=records.filter(r=>r&&typeof r.id==='string'&&Number.isFinite(Date.parse(r.date+'T00:00:00Z'))&&Date.parse(r.date+'T00:00:00Z')>=start&&Date.parse(r.date+'T00:00:00Z')<=end&&typeof r.correct==='boolean'&&Number.isFinite(r.margin));
    const unique=[...new Map(rows.map(r=>[r.id,r])).values()];
    const wins=unique.filter(r=>r.correct).length,confidence=unique.filter(r=>Number.isInteger(r.confidence)&&r.confidence>=1&&r.confidence<=5);
    const positions={};
    for(const row of unique)for(const [position,won] of Object.entries(row.positions||{}))if(['QB','RB','WR','TE','FLEX','K','DEF'].includes(position)&&typeof won==='boolean') {const p=positions[position]||={wins:0,total:0};p.total++;p.wins+=Number(won);}
    return {played:unique.length,wins,accuracy:unique.length?Math.round(wins/unique.length*100):null,days:new Set(unique.map(r=>r.date)).size,assisted:unique.filter(r=>r.assisted).length,biggestMiss:unique.filter(r=>!r.correct).sort((a,b)=>b.margin-a.margin)[0]?.margin??null,confidenceEarned:confidence.reduce((n,r)=>n+(r.correct?r.confidence:0),0),confidenceStaked:confidence.reduce((n,r)=>n+r.confidence,0),positions};
  }
  function read(){try{const records=JSON.parse(localStorage.getItem(key));return Array.isArray(records)?records:[];}catch{return [];}}
  function report(){return summarize(read(),day(new Date()));}
  async function download(stats) {
    const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1080;const c=canvas.getContext('2d');
    c.fillStyle='#161a1b';c.fillRect(0,0,1080,1080);c.fillStyle='#6ee5c5';c.fillRect(64,64,32,80);c.fillStyle='#ff977f';c.fillRect(112,64,32,80);c.fillStyle='#fff';c.font='700 48px sans-serif';c.fillText('SUNDAY SPLIT',176,122);c.font='700 60px sans-serif';c.fillText('YOUR LAST 7 DAYS',64,270);c.fillStyle='#6ee5c5';c.font='800 168px sans-serif';c.fillText(stats.accuracy===null?'--':stats.accuracy+'%',64,485);c.fillStyle='#fff';c.font='36px sans-serif';c.fillText(`${stats.wins}/${stats.played} winners picked`,64,565);c.fillText(`${stats.days} days played / ${stats.assisted} hints used`,64,635);c.font='28px sans-serif';c.fillText('DEVICE-LOCAL STATS / '+day(new Date()),64,875);c.fillStyle='#6ee5c5';c.fillText('sundaysplit.app',64,980);
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)return;
    const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='sunday-split-weekly.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function open() {
    const s=report(),{dialog,button,share}=window.SplitSocial;
    const position=Object.entries(s.positions).sort((a,b)=>b[1].wins/b[1].total-a[1].wins/a[1].total)[0];
    const el=dialog('Your last 7 days',`<p class="social-note">This device only. Starts with picks made after this update.</p><h3>${s.accuracy===null?'No picks yet':s.accuracy+'% accuracy'}</h3><p>${s.wins}/${s.played} winners picked / ${s.days} days played / ${s.assisted} hints used</p><p>Biggest miss: ${s.biggestMiss===null?'None':s.biggestMiss.toFixed(2)+'-point winning margin'}</p><p>Confidence: ${s.confidenceEarned}/${s.confidenceStaked} staked points earned</p>${position?`<p>Strongest position alignment: <strong>${position[0]}</strong> (${position[1].wins}/${position[1].total})</p><p class="social-note">How often your chosen lineup outscored its opponent at that position. This is not a separate prediction you made.</p>`:''}`);
    if(s.played){el.querySelector('.dialog-body').append(button('Download card','download',()=>download(s)),button('Share recap','share-2',()=>share(`My Sunday Split week: ${s.wins}/${s.played}, ${s.accuracy}% accuracy. Think you know ball?`,'https://www.sundaysplit.app/','weekly')));window.lucide?.createIcons();}
  }
  window.SplitWrapped={summarize,report,open};
  function mount(){const header=document.querySelector('.header-right');if(header&&!header.querySelector('[data-wrapped]')){const b=window.SplitSocial.button('Weekly recap','calendar-range',open);b.dataset.wrapped='';header.append(b);window.lucide?.createIcons();}}
  document.addEventListener('split:round',mount);document.addEventListener('split:complete',mount);
  document.addEventListener('split:pick',({detail:d})=>{
    const entry=d.results[d.index];if(!entry)return;
    const positions={};for(const slot of new Set(d.round.teams[0].players.map(p=>p.slot))){const totals=d.round.teams.map(t=>t.players.filter(p=>p.slot===slot).reduce((n,p)=>n+p.points,0));if(totals[0]!==totals[1])positions[slot]=totals[entry.pick]>totals[1-entry.pick];}
    const record={id:d.pack.id+':'+d.index,date:day(new Date()),correct:entry.pick===(d.round.teams[0].total>d.round.teams[1].total?0:1),assisted:entry.hint!==null,confidence:entry.confidence??null,margin:Math.abs(d.round.teams[0].total-d.round.teams[1].total),positions};
    try{const records=read();if(!records.some(r=>r.id===record.id)){records.push(record);localStorage.setItem(key,JSON.stringify(records.slice(-3000)));}}catch{}
  });
  try{const today=day(new Date()),last=localStorage.getItem('sunday-split:last-visit');if(last&&Date.parse(today+'T00:00:00Z')-Date.parse(last+'T00:00:00Z')===86400000)window.SplitSocial.track('next_day_return');localStorage.setItem('sunday-split:last-visit',today);}catch{}
})();
