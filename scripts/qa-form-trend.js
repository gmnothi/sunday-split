async page => {
  const assert=(ok,message)=>{if(!ok)throw Error(message);};
  await page.evaluate(()=>{localStorage.clear();localStorage.setItem('sunday-split:tutorial:v1','done');});
  await page.emulateMedia({reducedMotion:'reduce'});
  for(const season of [2025,2026])for(const theme of ['light','dark']) {
    await page.evaluate(theme=>localStorage.setItem('sunday-split:theme',theme),theme);
    await page.goto(`http://127.0.0.1:4317/?practice=trend-integration-${theme}&season=${season}`);
    await page.waitForSelector('.form-sparkline');
    const before=await page.locator('.form-sparkline').evaluateAll(nodes=>nodes.map(n=>n.outerHTML));
    for(const width of [320,393,768,1280]) {
      await page.setViewportSize({width,height:852});
      const good=await page.evaluate(()=>{
        if(document.documentElement.scrollWidth>innerWidth)return false;
        return [...document.querySelectorAll('.form-sparkline')].every(svg=>{
          const r=svg.getBoundingClientRect(),cell=svg.closest('.player').getBoundingClientRect(),score=svg.closest('.player').querySelector('.player-score').getBoundingClientRect();
          return r.width>0&&r.left>=cell.left&&r.right<=cell.right+1&&!(r.bottom>score.top+1&&r.top<score.bottom-1&&r.right>score.left+1&&r.left<score.right-1);
        });
      });
      assert(good,`${season}/${theme}/${width}: graph overlap`);
    }
    await page.getByRole('button',{name:'Pick lineup A',exact:true}).click();
    await page.locator('#next').waitFor();
    assert(JSON.stringify(before)===JSON.stringify(await page.locator('.form-sparkline').evaluateAll(nodes=>nodes.map(n=>n.outerHTML))),'Graph changed after answer revealed');
    await page.setViewportSize({width:393,height:852});
    await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
    await page.screenshot({path:`output/playwright/form-trend-${season}-${theme}.png`});
  }
  console.log('Both seasons/themes: visible trend graphs, no overlap, prior data unchanged after reveal.');
}
