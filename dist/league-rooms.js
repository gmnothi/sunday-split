(() => {
  async function request(path,options={}) {
    const response=await fetch('/api/'+path,{credentials:'same-origin',...options,headers:{'Content-Type':'application/json',...options.headers},...(options.body?{body:JSON.stringify(options.body)}:{})});
    let data;try{data=await response.json();}catch{throw new Error('Shared play is unavailable on this host.');}if(!response.ok)throw new Error(data.error||'Request failed');return data;
  }
  function nickname(action) {
    const {dialog}=window.SplitSocial,el=dialog('Play with your league','<form id="nickname-form"><label>Nickname<input required maxlength="24" autocomplete="nickname"></label><button type="submit" class="social-button">Continue</button><p class="social-status" role="status"></p><p class="social-note">Anonymous browser profile, not a verified account. Your nickname and final score will be visible to people with the challenge link. Browser profiles last 30 days.</p></form>');
    el.querySelector('#nickname-form').onsubmit=async event=>{event.preventDefault();const submit=el.querySelector('[type=submit]');submit.disabled=true;try{await request('session',{method:'POST',body:{name:el.querySelector('input').value.trim()}});await action();el.close();}catch(error){el.querySelector('[role=status]').textContent=error.message;submit.disabled=false;}};
  }
  async function prepare() {
    const id=new URLSearchParams(location.search).get('room');if(!id)return;
    if(!/^[a-f0-9]{32}$/.test(id))throw new Error('Invalid room link');
    const room=await request('rooms/'+id);window.GameLinks.accept(room.token);
    window.LeagueRooms.active=room;
    const url=new URL(location.href);url.hash='play='+room.token;history.replaceState(null,'',url);
  }
  async function scores(id) {
    const data=await request(`rooms/${id}/scores`),{dialog,esc}=window.SplitSocial;
    const el=dialog('League challenge standings',`<p class="social-note">Casual browser profiles, not verified competitors. Only final totals are shown.</p><table><thead><tr><th>Player</th><th>Correct</th><th>Points</th><th>Hints</th></tr></thead><tbody>${data.scores.map(r=>`<tr><th scope="row">${esc(r.name)}</th><td>${r.wins}/5</td><td>${r.points}/10</td><td>${r.assisted}</td></tr>`).join('')}</tbody></table>`);
    el.querySelector('.dialog-body').append(window.SplitSocial.button('Refresh','refresh-cw',async()=>{el.close();try{await scores(id);}catch(error){window.SplitSocial.dialog('Standings unavailable',`<p>${esc(error.message)}</p>`);}}));window.lucide?.createIcons();
  }
  document.addEventListener('split:complete',({detail:d})=>{
    if(d.pack.rounds.length!==5||d.confidence||d.variant||d.pool.custom)return;
    const summary=document.querySelector('.summary');if(!summary||summary.querySelector('[data-room]'))return;
    const id=new URLSearchParams(location.search).get('room');
    const b=window.SplitSocial.button(id?'Submit & see league scores':'Challenge your league','users',()=>nickname(async()=>{
      if(id){await request(`rooms/${id}/submit`,{method:'POST',body:{picks:d.results}});await scores(id);return;}
      const url=new URL(window.GameLinks.url(d.pack.rounds,d.pool)),spec=window.GameLinks.decode(new URLSearchParams(url.hash.slice(1)).get('play'));
      const room=await request('rooms',{method:'POST',body:spec});await request(`rooms/${room.id}/submit`,{method:'POST',body:{picks:d.results}});url.searchParams.set('room',room.id);await window.SplitSocial.share('Same five matchups. Finish your picks to unlock the league standings.',url.href,'league_room');
    }));b.dataset.room='';summary.append(b);window.lucide?.createIcons();
  });
  window.LeagueRooms={prepare,request,nickname};
})();
