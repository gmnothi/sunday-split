(() => {
  const key='sunday-split:tutorial:v1';
  let visited=false;
  try { visited=localStorage.getItem(key)==='done'; } catch {}
  const icon=name=>`<i data-lucide="${name}" aria-hidden="true"></i>`;
  function open({mode='daily',reduceMotion=false}={}) {
    if(document.querySelector('#split-tutorial'))return;
    const previous=document.activeElement;
    const dialog=document.createElement('dialog');
    dialog.id='split-tutorial';dialog.className='split-tutorial';
    dialog.setAttribute('aria-labelledby','tutorial-title');
    dialog.setAttribute('aria-describedby','tutorial-copy');
    dialog.classList.toggle('tutorial-still',reduceMotion);
    const oldOverflow=document.body.style.overflow;
    let step=0,timer=null,picked=false;
    const confidence=mode==='confidence',endless=mode==='endless';
    function finish() { dialog.close(); }
    dialog.addEventListener('close',()=>{
      clearTimeout(timer);visited=true;
      try {localStorage.setItem(key,'done');}catch{}
      dialog.remove();document.body.style.overflow=oldOverflow;
      if(previous instanceof HTMLElement && previous.isConnected)previous.focus({preventScroll:true});
    });
    const titles=['You know ball. Prove it.','Make your call.',endless?'Keep the calls coming.':'Five matchups. One score.'];
    const descriptions=[
      'Two real starting lineups. Compare recent form and NFL opponents. Who won?',
      'Pick a lineup below for a spoiler-free sample reveal.',
      confidence?'Use each confidence value, 1 to 5, once. A correct pick earns its value. No hints.':endless?'Correct picks earn 2 points, or 1 with a hint. Keep playing for your best run.':'A correct pick earns 2 points, or 1 with a hint. Wrong picks earn 0.'
    ];
    function preview() {
      if(step===2)return `<div class="tutorial-finish">${icon(endless?'infinity':'trophy')}<strong>${confidence?'15':endless?'Next up':'4 / 5'}</strong><span>${confidence?'POSSIBLE POINTS':endless?'ANOTHER REAL MATCHUP':'WINNERS PICKED'}</span>${endless?'':`<div class="tutorial-squares" aria-label="Example: four correct, one incorrect">${[1,1,0,1,1].map(n=>`<span class="${n?'hit':'miss'}">${icon(n?'check':'x')}</span>`).join('')}</div>`}</div>`;
      return `<div class="tutorial-match" data-picked="false"><div class="tutorial-example">EXAMPLE ONLY / NOT YOUR DAILY GAME</div><div class="tutorial-teams">${['A','B'].map((side,i)=>`<div class="tutorial-side side-${side.toLowerCase()}"><span>LINEUP ${side}</span><img src="https://sleepercdn.com/content/nfl/players/${i?'4881':'4046'}.jpg" alt="" width="64" height="64"><small>${i?'Lamar Jackson':'Patrick Mahomes'} <b>QB</b></small><strong class="tutorial-points">${step===0?'?':'&mdash;'}</strong><div class="tutorial-meter"><span></span></div>${step===1?`<button type="button" class="tutorial-pick" data-side="${side}">Pick ${side} ${icon('check')}</button>`:'<span class="tutorial-hidden">POINTS HIDDEN</span>'}</div>`).join('')}</div><p class="tutorial-demo-result" aria-live="polite">${step===0?'Compare every starter, not just the quarterback.':'Your practice call won\'t affect your score.'}</p></div>`;
    }
    function render(focus=true) {
      clearTimeout(timer);picked=false;
      dialog.innerHTML=`<div class="tutorial-top"><span>SUNDAY SPLIT / WARMUP</span><button class="tutorial-close" aria-label="Close tutorial" title="Close tutorial">${icon('x')}</button></div><div class="tutorial-content"><p class="tutorial-step">${String(step+1).padStart(2,'0')} / 03</p><h2 id="tutorial-title">${titles[step]}</h2><p id="tutorial-copy">${descriptions[step]}</p>${preview()}<p class="tutorial-tip">${step===0?'Season, week and scoring format are on every matchup.':step===1?(confidence?'In Confidence, bigger bets earn bigger rewards.': 'Need an edge? One hint reveals a position on both sides.'):(mode==='daily'?'Everyone gets the same five. A new game drops at midnight Eastern.':mode==='practice'?'Practice sets are separate from your daily score.':confidence?'Five correct calls with all five values earns a perfect 15.':'Endless results are separate from your daily score.')}</p></div><div class="tutorial-controls"><button class="tutorial-secondary" id="tutorial-back">${step===0?'Skip':icon('arrow-left')+' Back'}</button><div class="tutorial-dots" aria-label="Step ${step+1} of 3">${[0,1,2].map(n=>`<span class="${n===step?'active':''}"></span>`).join('')}</div><button class="tutorial-primary" id="tutorial-next">${step===2?'Let\'s play':'Next'} ${icon(step===2?'play':'arrow-right')}</button></div>`;
      dialog.querySelector('.tutorial-close').onclick=finish;
      dialog.querySelector('#tutorial-back').onclick=()=>{if(step===0)finish();else{step--;render();}};
      dialog.querySelector('#tutorial-next').onclick=()=>{if(step===2)finish();else{step++;render();}};
      dialog.querySelectorAll('.tutorial-pick').forEach(button=>button.onclick=()=>reveal(button.dataset.side));
      window.lucide?.createIcons();
      if(focus)dialog.querySelector('#tutorial-next').focus({preventScroll:true});
    }
    function reveal(side) {
      if(picked)return;picked=true;
      dialog.querySelectorAll('.tutorial-pick').forEach(b=>{b.disabled=true;b.classList.toggle('selected',b.dataset.side===side);});
      dialog.querySelector('.tutorial-demo-result').textContent='The scores are coming in...';
      dialog.querySelector('.tutorial-match').dataset.picked='true';
      const done=()=>{
        dialog.querySelectorAll('.tutorial-points').forEach((el,i)=>el.textContent=i?'118.6':'112.4');
        dialog.querySelector('.side-b').classList.add('tutorial-winner');
        dialog.querySelector('.tutorial-demo-result').textContent=`${side==='B'?'Good call! ':'So close. '}Lineup B won by 6.2.`;
      };
      if(reduceMotion || matchMedia('(prefers-reduced-motion: reduce)').matches)done();
      else timer=setTimeout(done,1100);
    }
    render(false);document.body.append(dialog);dialog.showModal();document.body.style.overflow='hidden';
    dialog.querySelector('#tutorial-next').focus({preventScroll:true});
  }
  window.SplitTutorial={open,firstVisit:options=>{if(!visited)open(options);}};
})();
