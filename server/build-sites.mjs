import fs from 'node:fs/promises';import path from 'node:path';import vm from 'node:vm';
import {gzipSync} from 'node:zlib';import {createHash} from 'node:crypto';import {build} from 'esbuild';
const root=new URL('../',import.meta.url),dist=new URL('dist/',root),assets={},catalogs={};
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.txt':'text/plain; charset=utf-8','.xml':'application/xml'};
async function collect(directory,prefix=''){
  for(const entry of await fs.readdir(directory,{withFileTypes:true})){
    if(entry.name.startsWith('.')||entry.name==='server')continue;
    const file=new URL(entry.name+(entry.isDirectory()?'/':''),directory),name=prefix+'/'+entry.name;
    if(entry.isDirectory()){await collect(file,name);continue;}
    const content=await fs.readFile(file);assets[name]={type:types[path.extname(entry.name)]||'application/octet-stream',body:gzipSync(content,{level:9}).toString('base64'),etag:'"'+createHash('sha256').update(content).digest('hex').slice(0,24)+'"'};
  }
}
await collect(dist);
for(const season of [2025,2026]){
  const ctx={window:{}};vm.runInNewContext(await fs.readFile(new URL(`data${season===2025?'-2025':''}.js`,dist),'utf8'),ctx);
  const pool=season===2025?ctx.window.MATCHUP_POOL_2025:ctx.window.MATCHUP_POOL;
  // The scoring service needs canonical totals and starter counts, not player identities.
  catalogs[season]=pool.rounds.map(r=>({key:r.key,season:r.season,teams:r.teams.map(t=>({total:t.total,players:t.players.map(()=>null)}))}));
}
await fs.mkdir(new URL('.sites-runtime/',root),{recursive:true});
await fs.writeFile(new URL('.sites-runtime/sites-assets.mjs',root),'export const assets='+JSON.stringify(assets)+';\nexport const catalogs='+JSON.stringify(catalogs)+';\n');
await fs.writeFile(new URL('.sites-runtime/sites-preview.json',root),JSON.stringify({name:'sunday-split-local',main:'../dist/server/index.js',compatibility_date:'2026-10-16',d1_databases:[{binding:'DB',database_name:'sunday-split-local',migrations_dir:'../drizzle'}]},null,2)+'\n');
await fs.mkdir(new URL('server/',dist),{recursive:true});
await build({entryPoints:[new URL('server/sites-worker.mjs',root).pathname],outfile:new URL('server/index.js',dist).pathname,bundle:true,format:'esm',platform:'browser',target:'es2022',minify:true});
await fs.mkdir(new URL('.openai/',dist),{recursive:true});
await fs.copyFile(new URL('.openai/hosting.json',root),new URL('.openai/hosting.json',dist));
await fs.cp(new URL('drizzle/',root),new URL('.openai/drizzle/',dist),{recursive:true});
const worker=await fs.readFile(new URL('server/index.js',dist));
console.log(JSON.stringify({assets:Object.keys(assets).length,workerBytes:worker.length,gzipBytes:gzipSync(worker).length,migrations:'drizzle',catalogRounds:Object.fromEntries(Object.entries(catalogs).map(([season,rounds])=>[season,rounds.length]))}));
