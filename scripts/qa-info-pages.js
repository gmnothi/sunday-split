async page => {
  const base=new URL(page.url()).origin,check=(ok,text)=>{if(!ok)throw new Error(text);},errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.context().route('https://www.googletagmanager.com/**',route=>route.abort());
  await page.addInitScript(()=>localStorage.setItem('sunday-split:tutorial:v1','done'));await page.emulateMedia({reducedMotion:'reduce'});
  await page.setViewportSize({width:1440,height:1000});await page.goto(base+'/');await page.locator('[data-pick="0"]').waitFor();
  check(await page.locator('.site-context').count()===1,'Home explanation missing');await page.locator('.site-context').scrollIntoViewIfNeeded();await page.screenshot({path:'output/playwright/footer-desktop.png',fullPage:false});
  const links=['/how-it-works/','/about/','/privacy/'];
  for(const width of [320,390,1440])for(const path of links){
    await page.setViewportSize({width,height:width<600?844:1000});const response=await page.goto(base+path);check(response.status()===200,'Broken page '+path);await page.locator('h1').waitFor();await page.evaluate(()=>document.fonts.ready);
    check(await page.locator('.site-footer').count()===1,'Footer missing '+path);check(await page.locator('.info-nav [aria-current=page]').count()===1,'Current page missing');
    for(const theme of ['light','dark']){await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);check(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth),'Horizontal overflow '+path+' '+width+' '+theme);}
  }
  await page.setViewportSize({width:390,height:844});await page.goto(base+'/how-it-works/');await page.screenshot({path:'output/playwright/how-it-works-mobile.png',fullPage:true});
  await page.locator('.site-footer a[href="/privacy/"]').click();await page.locator('#remove-profile').waitFor();
  await page.evaluate(()=>localStorage.setItem('sunday-split:footer-qa-save','preserved'));
  const before=await page.evaluate(()=>JSON.stringify(Object.fromEntries(Object.keys(localStorage).filter(k=>k.startsWith('sunday-split:')).map(k=>[k,localStorage.getItem(k)]))));
  const created=await page.evaluate(async()=>{const r=await fetch('/api/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'Footer QA'})});return r.status;});check(created===201||created===200,'QA profile creation failed');
  await page.locator('#remove-profile').click();await page.locator('#cancel-remove').click();check((await (await page.request.get(base+'/api/session')).json()).name==='Footer QA','Cancel deleted profile');
  await page.locator('#remove-profile').click();await page.locator('#confirm-remove').click();await page.waitForFunction(()=>document.querySelector('#privacy-status').textContent.includes('unchanged'));
  check((await (await page.request.get(base+'/api/session')).json()).name===null,'Profile not removed');
  const after=await page.evaluate(()=>JSON.stringify(Object.fromEntries(Object.keys(localStorage).filter(k=>k.startsWith('sunday-split:')).map(k=>[k,localStorage.getItem(k)]))));check(before===after,'Privacy control changed game saves');
  await page.evaluate(()=>localStorage.removeItem('sunday-split:footer-qa-save'));
  const nojs=await page.context().browser().newContext({javaScriptEnabled:false});const reader=await nojs.newPage();await reader.goto(base+'/how-it-works/');check((await reader.locator('h1').innerText()).includes('How to play'),'No-JS page broken');await nojs.close();
  for(const route of ['how-it-works','about','privacy']){const r=await page.request.get(base+'/'+route+'?source=qa',{maxRedirects:0});check(r.status()===308&&r.headers().location==='/'+route+'/?source=qa','Canonical redirect broken');}
  check(errors.length===0,errors.join('; '));return {passed:['explanation below game','footer navigation','three static information pages','320/390/1440px light and dark','confirmed profile deletion','saved progress preserved','no-JS reading','canonical redirects'],testProfileRemoved:true};
}
