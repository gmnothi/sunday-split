async (page) => {
  const assert=(ok,message)=>{if(!ok)throw new Error(message);};
  await page.evaluate(()=>localStorage.removeItem('sunday-split:tutorial:v1'));
  await page.reload();
  const modal=page.locator('#split-tutorial');
  await modal.waitFor({state:'visible'});
  const initialProgress=await page.evaluate(()=>Object.fromEntries(Object.entries(localStorage).filter(([k])=>!k.includes('tutorial'))));
  for(const width of [320,375,393,768,1280]) {
    await page.setViewportSize({width,height:800});
    assert(await modal.evaluate(el=>{const r=el.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&el.scrollWidth<=el.clientWidth;}),'Modal overflow at '+width);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Page overflow at '+width);
  }
  await page.setViewportSize({width:393,height:852});
  await page.screenshot({path:'output/playwright/tutorial-mobile.png'});
  await page.locator('#tutorial-next').click();
  await page.locator('[data-side="B"]').click();
  await page.getByText('Good call! Lineup B won by 6.2.').waitFor();
  assert(await page.locator('.tutorial-points').allTextContents().then(x=>x.join(',')==='112.4,118.6'),'Sample scores wrong');
  await page.locator('#tutorial-next').click();
  await page.locator('#tutorial-next').click();
  await modal.waitFor({state:'detached'});
  assert(await modal.count()===0,'Completion did not close');
  const afterProgress=await page.evaluate(()=>Object.fromEntries(Object.entries(localStorage).filter(([k])=>!k.includes('tutorial'))));
  assert(JSON.stringify(initialProgress)===JSON.stringify(afterProgress),'Tutorial changed real progress');
  await page.reload();await page.locator('#help').waitFor();
  assert(await modal.count()===0,'Tutorial repeated after reload');
  await page.locator('#help').click();await modal.waitFor();
  await page.keyboard.press('Escape');
  await modal.waitFor({state:'detached'});
  assert(await page.locator('#help').evaluate(el=>el===document.activeElement),'Focus did not return to Help');
  for(const mode of ['?confidence=1','?endless=1','?practice=qa-tutorial&season=2025']) {
    await page.goto('http://127.0.0.1:4317/'+mode);
    await page.locator('#help').click();
    await page.locator('#tutorial-next').click();
    await page.locator('#tutorial-next').click();
    const copy=await page.locator('#tutorial-copy').textContent();
    assert(mode.includes('confidence')?copy.includes('1 to 5'):mode.includes('endless')?copy.includes('best run'):copy.includes('Wrong picks'),'Wrong mode instructions');
    await page.keyboard.press('Escape');
    await modal.waitFor({state:'detached'});
  }
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.locator('#help').click();await page.locator('#tutorial-next').click();
  await page.locator('[data-side="A"]').click();
  assert((await page.locator('.tutorial-demo-result').textContent()).includes('So close.'),'Reduced-motion reveal not immediate');
  await page.keyboard.press('Escape');
  await modal.waitFor({state:'detached'});
  await page.evaluate(()=>localStorage.removeItem('sunday-split:tutorial:v1'));
  await page.reload();await modal.waitFor();
  await page.getByRole('button',{name:'Skip',exact:true}).click();
  await modal.waitFor({state:'detached'});
  await page.reload();await page.locator('#help').waitFor();
  assert(await modal.count()===0,'Skip did not persist');
  console.log('Tutorial passed: five viewport widths, demo scores, no game mutation, persistent dismissal, focus restoration, all modes, 2025 archive and reduced motion.');
}
