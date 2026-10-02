async page => {
  const assert=(ok,message)=>{if(!ok)throw Error(message);};
  await page.evaluate(()=>{localStorage.clear();localStorage.setItem('sunday-split:tutorial:v1','done');});
  await page.reload();
  await page.waitForSelector('#reveal-pace');
  assert(await page.locator('#reveal-pace').inputValue()==='quick','Endless should default to quick');
  await page.setViewportSize({width:393,height:852});
  const start=Date.now();
  await page.getByRole('button',{name:'Pick lineup A',exact:true}).click();
  assert(await page.locator('#reveal-pace').isDisabled(),'Pace must lock during reveal');
  await page.locator('#next').waitFor({timeout:6500});
  const duration=Date.now()-start;
  assert(duration<6500,'Quick reveal too slow');
  assert(await page.locator('.paired-row:not(.revealed)').count()===0,'Quick reveal missed scores');
  await page.locator('.matchup-breakdown summary').click();
  const issues=await page.evaluate(()=>{
    const rows=[...document.querySelectorAll('.matchup-breakdown tbody tr')];
    const sums=[0,0];
    for(const row of rows)row.querySelectorAll('td').forEach((td,i)=>{if(i<2)sums[i]+=Number(td.textContent);});
    const totals=[0,1].map(i=>Number(document.querySelector('#total-'+i).textContent));
    return {overflow:document.documentElement.scrollWidth>innerWidth,math:sums.every((n,i)=>Math.abs(n-totals[i])<.02)};
  });
  assert(!issues.overflow&&issues.math,'Breakdown overflow or wrong totals');
  for(const width of [320,393,768,1280]){
    await page.setViewportSize({width,height:852});
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Responsive overflow');
  }
  await page.locator('#reveal-pace').selectOption('cinematic');
  await page.reload();
  assert(await page.locator('#reveal-pace').inputValue()==='cinematic','Pace preference did not persist');
  await page.locator('#next').click();
  await page.getByRole('button',{name:'Pick lineup B',exact:true}).click();
  await page.locator('#skip').click();
  assert(await page.locator('#next').count()===1,'Skip failed');
  await page.goto('http://127.0.0.1:4317/?practice=pace-regression');
  await page.waitForSelector('[data-pick]');
  assert(await page.locator('#reveal-pace').count()===0,'Endless control leaked into five-round game');
  await page.getByRole('button',{name:'Pick lineup A',exact:true}).click();
  await page.waitForTimeout(4500);
  assert(await page.locator('#next').count()===0,'Daily-style suspense shortened');
  await page.locator('#skip').click();
  await page.locator('.matchup-breakdown summary').click();
  await page.screenshot({path:'output/playwright/reveal-breakdown.png',fullPage:true});
  console.log(JSON.stringify({quickRevealMs:duration,breakdown:true,persistence:true,skip:true,dailyPacing:true}));
}
