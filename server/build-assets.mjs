import fs from 'node:fs/promises';import vm from 'node:vm';
const target=new URL('../.sites-runtime/social-assets/',import.meta.url);
await fs.mkdir(target,{recursive:true});await fs.cp(new URL('../dist/',import.meta.url),target,{recursive:true});
for(const season of [2025,2026]){const ctx={window:{}};vm.runInNewContext(await fs.readFile(new URL(`../dist/data${season===2025?'-2025':''}.js`,import.meta.url),'utf8'),ctx);const pool=season===2025?ctx.window.MATCHUP_POOL_2025:ctx.window.MATCHUP_POOL;await fs.writeFile(new URL(`catalog-${season}.json`,target),JSON.stringify(pool.rounds));}
console.log('Built static assets and authoritative matchup catalogs.');
