async page => {
  await page.setViewportSize({width:393,height:852});
  await page.emulateMedia({reducedMotion:'reduce'});
  const report=[];
  for(const season of [2026,2025]) {
    await page.goto(`http://127.0.0.1:4317/?confidence=1&season=${season}`);
    await page.locator('.confidence-picker, .big-result').waitFor();
    await page.evaluate(()=>{
      for(const key of Object.keys(localStorage))if(key.includes('confidence:'))localStorage.removeItem(key);
    });
    await page.reload();
    await page.locator('.confidence-picker').waitFor();
    let points=0;
    for(const value of [5,4,3,2,1]) {
      const pick=page.getByRole('button',{name:'Pick lineup A',exact:true});
      if(!await pick.isDisabled())throw Error('Confidence required before pick');
      await page.getByRole('button',{name:`Confidence ${value}`,exact:true}).click();
      if(value===5) {
        await page.reload();await pick.waitFor();
        if(await pick.isDisabled())throw Error('Pending confidence lost');
      }
      await pick.click();
      await page.locator('#result').waitFor({state:'visible'});
      points+=Number((await page.locator('.result-kicker').innerText()).match(/\+(\d+)/)[1]);
      await page.getByRole('button',{name:value===1?'See results':'Next round',exact:true}).click();
      if(value>1&&!await page.getByRole('button',{name:`Confidence ${value}`,exact:true}).isDisabled())throw Error('Confidence reused');
    }
    await page.locator('.big-result').waitFor();
    if((await page.locator('.big-result').innerText()).replace(/\s/g,'')!==`${points}/15`)throw Error('Incorrect confidence total');
    await page.reload();await page.locator('.big-result').waitFor();
    report.push({season,points,completed:true,overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)});
  }
  return report;
}
