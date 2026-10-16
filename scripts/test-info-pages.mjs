import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const root=new URL('../dist/',import.meta.url),pages=['index.html','how-it-works/index.html','about/index.html','privacy/index.html'];
const sitemap=fs.readFileSync(new URL('sitemap.xml',root),'utf8');
for(const name of pages){
  const html=fs.readFileSync(new URL(name,root),'utf8');
  assert.equal((html.match(/<footer\b/g)||[]).length,1);
  for(const href of ['/how-it-works/','/about/','/privacy/','https://github.com/gmnothi'])assert(html.includes(`href="${href}"`),name+' missing link '+href);
  assert(html.includes('independent, fan-made game'));assert(html.includes('Sleeper API'));
  const canonical='https://www.sundaysplit.app/'+name.replace(/index\.html$/,'');assert(html.includes(`rel="canonical" href="${canonical}"`));assert(sitemap.includes(`<loc>${canonical}</loc>`));
  for(const match of html.matchAll(/(?:href|src)="(\/[^"#?]*)(?:#[^"]*)?"/g)){
    const target=match[1].endsWith('/')?match[1]+'index.html':match[1];assert(fs.existsSync(new URL('.'+target,root)),name+' broken local link '+match[1]);
  }
}
const home=fs.readFileSync(new URL('index.html',root),'utf8');assert(home.indexOf('id="about-game"')>home.indexOf('</main>'),'Explanation must stay after game');assert(home.includes('id="pool-count"'),'Pool count hook lost');
const elements=Object.fromEntries(['remove-profile','profile-confirm','confirm-remove','cancel-remove','privacy-status'].map(id=>['#'+id,{hidden:false,disabled:false,focus(){this.focused=true;}}]));
let calls=0,fail=false;const code=fs.readFileSync(new URL('info.js',root),'utf8');
vm.runInNewContext(code,{window:{},document:{querySelector:s=>elements[s]},fetch:async(path,options)=>{calls++;assert.equal(path,'/api/session');assert.equal(options.method,'DELETE');assert.equal(options.credentials,'same-origin');return {ok:!fail,json:async()=>({deleted:!fail})};}});
elements['#remove-profile'].onclick();assert.equal(calls,0,'Opening confirmation must not delete');elements['#cancel-remove'].onclick();assert.equal(calls,0,'Cancel must not delete');
elements['#remove-profile'].onclick();fail=true;await elements['#confirm-remove'].onclick();assert.equal(elements['#confirm-remove'].disabled,false);assert(elements['#privacy-status'].textContent.includes('could not'));
fail=false;await elements['#confirm-remove'].onclick();assert.equal(elements['#profile-confirm'].hidden,true);assert(elements['#privacy-status'].textContent.includes('unchanged'));assert(elements['#privacy-status'].focused);
console.log('Information pages, footer links, canonical URLs, sitemap, no-JS content and confirmed profile removal passed.');
