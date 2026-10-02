async page => {
  const assert=(ok,message)=>{if(!ok)throw Error(message);};
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.setViewportSize({width:393,height:852});
  const report=[];
  for(const mode of ['', '?practice=design-qa']) {
    await page.goto('http://127.0.0.1:4317/'+mode);
    await page.locator('#help').waitFor();
    await page.evaluate(()=>{
      for(const key of Object.keys(localStorage))if(/^sunday-split:(daily:|practice:)/.test(key))localStorage.removeItem(key);
      localStorage.setItem('sunday-split:tutorial:v1','done');
    });
    await page.reload();await page.locator('.roster').waitFor();
    let points=0;
    for(let i=0;i<5;i++) {
      if(i===0) {
        await page.getByRole('button',{name:'Use a hint',exact:true}).click();
        await page.getByRole('button',{name:'Reveal both QB scores',exact:true}).click();
      }
      await page.getByRole('button',{name:'Pick lineup A',exact:true}).click();
      await page.locator('#result').waitFor({state:'visible'});
      points+=Number((await page.locator('.result-kicker').innerText()).match(/\+(\d+)/)[1]);
      await page.getByRole('button',{name:i===4?'See results':'Next round',exact:true}).click();
    }
    await page.locator('.game-complete').waitFor();
    assert(await page.locator('.summary-details').count()===1,'Missing round breakdown');
    assert(await page.locator('.summary-details').getAttribute('open')===null,'Breakdown should start collapsed');
    assert(await page.locator('.game-complete .step').count()===5,'Not exactly five calls');
    assert((await page.locator('.summary-stats>div').first().innerText()).includes(String(points)),'Points changed');
    assert(await page.locator('.next-daily').count()===(mode?0:1),'Daily reset label on wrong mode');
    for(const width of [320,375,393,600,768,1280]) {
      await page.setViewportSize({width,height:852});
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Summary overflow at '+width);
    }
    await page.getByText('Round breakdown',{exact:true}).click();
    assert(await page.locator('.round-recap').isVisible(),'Breakdown inaccessible');
    await page.getByText('Round breakdown',{exact:true}).click();
    await page.setViewportSize({width:393,height:852});
    if(!mode)await page.screenshot({path:'output/playwright/design-daily-results.png',fullPage:true});
    await page.getByRole('button',{name:'Share results',exact:true}).click();
    await page.reload();await page.locator('.game-complete').waitFor();
    assert(await page.locator('.summary-details').count()===1,'Duplicate decorations after reload');
    report.push({mode:mode?'practice':'daily',points,completed:true});
  }
  await page.goto('http://127.0.0.1:4317/?endless=1');await page.locator('.roster').waitFor();
  if(await page.locator('#next').count())await page.locator('#next').click();
  await page.getByRole('button',{name:'Pick lineup A',exact:true}).click();
  await page.locator('#result').waitFor({state:'visible'});
  await page.getByRole('button',{name:'Next round',exact:true}).click();
  assert(await page.locator('[aria-current="step"]').count()===1,'Endless progress lost current round');
  return report;
}
