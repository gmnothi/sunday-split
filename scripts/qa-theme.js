async page => {
  const assert=(ok,message)=>{if(!ok)throw Error(message);};
  await page.evaluate(()=>{localStorage.clear();localStorage.setItem('sunday-split:tutorial:v1','done');});
  await page.emulateMedia({colorScheme:'dark',reducedMotion:'reduce'});
  await page.reload();
  await page.waitForSelector('.player-name');
  assert(await page.locator('html').getAttribute('data-theme')==='dark','System dark not applied');
  assert(await page.locator('#theme svg').count()===1,'Missing appearance icon');
  for(const width of [320,393,768,1280]) {
    await page.setViewportSize({width,height:852});
    await page.locator('#theme').click();
    assert(await page.locator('#theme-menu').isVisible(),'Appearance menu not open');
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Page overflow');
    const bounds=await page.locator('#theme-menu').boundingBox();
    assert(bounds.x>=0&&bounds.x+bounds.width<=width,'Menu outside viewport');
    await page.keyboard.press('Escape');
  }
  await page.locator('#theme').click();
  await page.getByLabel('Light',{exact:true}).check();
  assert(await page.locator('html').getAttribute('data-theme')==='light','Light override failed');
  await page.reload();
  assert(await page.locator('html').getAttribute('data-theme')==='light','Preference not persisted');
  await page.emulateMedia({colorScheme:'light',reducedMotion:'reduce'});
  await page.locator('#theme').click();
  await page.getByLabel('Dark',{exact:true}).check();
  assert(await page.locator('html').getAttribute('data-theme')==='dark','Dark override failed');
  await page.reload();
  await page.locator('#theme').click();
  await page.getByLabel('System',{exact:true}).check();
  assert(await page.locator('html').getAttribute('data-theme')==='light','Return to system failed');
  await page.emulateMedia({colorScheme:'dark',reducedMotion:'reduce'});
  await page.waitForFunction(()=>document.documentElement.dataset.theme==='dark');
  await page.locator('#help').click();
  await page.screenshot({path:'output/playwright/dark-tutorial.png'});
  await page.keyboard.press('Escape');
  await page.setViewportSize({width:393,height:852});
  await page.screenshot({path:'output/playwright/dark-mobile.png',fullPage:true});
  const contrast=await page.evaluate(()=>{
    const rgb=color=>color.match(/\d+/g).slice(0,3).map(Number);
    const lum=color=>rgb(color).map(n=>{n/=255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4;}).reduce((sum,n,i)=>sum+n*[.2126,.7152,.0722][i],0);
    const names=document.querySelector('.player-name'),meta=document.querySelector('.player-matchup');
    const bg=lum(getComputedStyle(document.querySelector('.matchup')).backgroundColor);
    return [names,meta].map(el=>{const fg=lum(getComputedStyle(el).color);return (Math.max(fg,bg)+.05)/(Math.min(fg,bg)+.05);});
  });
  assert(contrast.every(n=>n>=4.5),'Insufficient text contrast');
  await page.getByRole('button',{name:'Pick lineup A',exact:true}).click();
  await page.locator('#next').waitFor();
  await page.locator('.matchup-breakdown summary').click();
  await page.screenshot({path:'output/playwright/dark-results.png',fullPage:true});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Reveal overflow');
  await page.goto('http://127.0.0.1:4317/?confidence=1&season=2025');
  await page.waitForSelector('.confidence-picker');
  assert(await page.locator('html').getAttribute('data-theme')==='dark','Theme lost on navigation');
  await page.getByRole('button',{name:'Confidence 5',exact:true}).click();
  await page.setViewportSize({width:320,height:852});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Confidence overflow');
  console.log(JSON.stringify({system:true,override:true,persistence:true,contrast,widths:4,tutorial:true,reveal:true,confidence:true}));
}
