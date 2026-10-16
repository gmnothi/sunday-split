(() => {
  document.addEventListener('split:reveal',({detail:d})=>{
    if(d.pool.custom||d.variant)return;const result=document.querySelector('#result');if(!result||result.querySelector('[data-community]'))return;
    const {dialog,button,esc}=window.SplitSocial;
    const b=button('See community picks','chart-no-axes-combined',async()=>{
      b.disabled=true;
      const vote=async()=>{
        const original=d.pool.rounds.find(r=>r.key===d.round.key),flipped=original.teams[0].total!==d.round.teams[0].total;
        const entry=d.results[d.index],pick=flipped?1-entry.pick:entry.pick;
        const counts=await window.LeagueRooms.request('votes',{method:'POST',body:{key:d.round.key,season:d.round.season,pick}});
        const a=flipped?counts.b:counts.a,bCount=flipped?counts.a:counts.b;
        const html=counts.total<5?`<p>${counts.total} browser pick${counts.total===1?'':'s'} so far. Percentages unlock at five picks.</p>`:`<p><strong>${Math.round(a/counts.total*100)}% picked A</strong> / ${Math.round(bCount/counts.total*100)}% picked B</p><label>Lineup A<meter min="0" max="${counts.total}" value="${a}">${a}/${counts.total}</meter></label><label>Lineup B<meter min="0" max="${counts.total}" value="${bCount}">${bCount}/${counts.total}</meter></label><p>${Math.round((d.round.teams[0].total>d.round.teams[1].total?a:bCount)/counts.total*100)}% picked the winning lineup.</p>`;
        dialog('The Split',html+`<p class="social-note">${counts.total} real anonymous-browser picks, not verified unique people. One vote per browser profile per matchup. ${counts.yourPick!==pick?'Your earlier vote was kept for this replay.':''}</p>`);
      };
      try{const profile=await window.LeagueRooms.request('session');if(profile.name)await vote();else window.LeagueRooms.nickname(vote);}catch(error){dialog('Community picks unavailable',`<p>${esc(error.message)}</p>`);}finally{b.disabled=false;}
    });b.dataset.community='';result.append(b);window.lucide?.createIcons();
  });
})();
