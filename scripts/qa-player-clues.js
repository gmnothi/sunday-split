async page => {
  const assert=(ok,message)=>{if(!ok)throw Error(message);};
  await page.emulateMedia({reducedMotion:'reduce'});
  const report=[];
  for(const season of [2026,2025])for(const mode of ['practice=clues-ui-qa','confidence=1','endless=1']) {
    await page.goto(`http://127.0.0.1:4317/?${mode}&season=${season}`);
    await page.locator('.roster').waitFor();
    await page.evaluate(()=>{for(const key of Object.keys(localStorage))if(/^sunday-split:(practice:|confidence:|endless:)/.test(key))localStorage.removeItem(key);});
    await page.reload();await page.locator('.roster').waitFor();
    if(await page.locator('#split-tutorial').count())await page.getByRole('button',{name:'Skip',exact:true}).click();
    const players=await page.locator('.player').count();
    assert(await page.locator('.player-matchup').count()===players,'Missing opponent labels');
    assert(await page.locator('.player-form').count()===players,'Missing form labels');
    assert((await page.locator('.player-score').allTextContents()).every(s=>s.trim()==='\u2014'),'Actual scores leaked before pick');
    const forms=await page.locator('.player-form').allTextContents();
    assert(forms.some(s=>/\dG AVG/.test(s)),'No visible averages');
    assert(forms.every(s=>!s.includes('AVG UNAVAILABLE')),'Wrong or missing season pack');
    for(const width of [320,393,600,768,1280]) {
      await page.setViewportSize({width,height:852});
      const failures=await page.evaluate(()=>{
        const issues=[];
        if(document.documentElement.scrollWidth>innerWidth)issues.push('Page overflow');
        for(const cell of document.querySelectorAll('.player')) {
          const rect=cell.getBoundingClientRect(),score=cell.querySelector('.player-score').getBoundingClientRect(),info=cell.querySelector('.player-info').getBoundingClientRect();
          if(info.bottom>score.top+1 && info.left<score.right && score.left<info.right)issues.push('Context overlaps actual score');
          for(const el of cell.querySelectorAll('.player-matchup,.player-form')) {
            const r=el.getBoundingClientRect();
            if(r.left<rect.left || r.right>rect.right+1 || r.bottom>rect.bottom+1)issues.push('Context outside player');
          }
        }
        return issues;
      });
      assert(!failures.length,`${season}/${mode}/${width}: ${failures}`);
    }
    if(mode.includes('confidence'))await page.getByRole('button',{name:'Confidence 5',exact:true}).click();
    await page.getByRole('button',{name:'Pick lineup A',exact:true}).click();
    await page.locator('#result').waitFor({state:'visible'});
    assert(JSON.stringify(await page.locator('.player-form').allTextContents())===JSON.stringify(forms),'Form changed during reveal');
    report.push({season,mode,players});
  }
  await page.route('**/clues-2025.js',route=>route.abort());
  await page.goto('http://127.0.0.1:4317/?practice=clue-fallback-qa&season=2025');
  await page.locator('.roster').waitFor();
  assert((await page.locator('.player-form').allTextContents()).every(s=>s==='AVG UNAVAILABLE'),'Missing data should be labeled, not fabricated');
  await page.unroute('**/clues-2025.js');
  return report;
}
