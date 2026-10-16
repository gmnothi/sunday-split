import fs from 'node:fs/promises';import {gunzipSync} from 'node:zlib';import assert from 'node:assert/strict';
import {openDb} from '../server/sqlite.mjs';
const source=await fs.readFile(new URL('../dist/server/index.js',import.meta.url));
const {default:worker}=await import('data:text/javascript;base64,'+source.toString('base64'));
const db=openDb(':memory:',new URL('../drizzle/',import.meta.url));
const env={DB:db};
for(const file of ['index.html','app.js','data.js','data-2025.js','clues-2026.js','style.css','vendor/lucide.js','og.png','robots.txt']){
  const response=await worker.fetch(new Request('https://game.test/'+(file==='index.html'?'':file)),env);
  assert.equal(response.status,200);assert.equal(response.headers.get('Content-Encoding'),'gzip');
  const original=await fs.readFile(new URL('../dist/'+file,import.meta.url));assert.deepEqual(gunzipSync(new Uint8Array(await response.arrayBuffer())),original,'Asset changed in Worker: '+file);
  const cached=await worker.fetch(new Request('https://game.test/'+file,{headers:{'If-None-Match':response.headers.get('ETag')}}),env);assert.equal(cached.status,304);
}
assert.equal((await worker.fetch(new Request('https://game.test/not-found'),env)).status,404);
const session=await worker.fetch(new Request('https://game.test/api/session',{method:'POST',headers:{Origin:'https://game.test','Content-Type':'application/json'},body:JSON.stringify({name:'Build check'})}),env);assert.equal(session.status,201);
const cookie=session.headers.get('Set-Cookie').split(';')[0];
const read=await worker.fetch(new Request('https://game.test/api/session',{headers:{Cookie:cookie}}),env);assert.equal((await read.json()).name,'Build check');
const tables=db.raw.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(r=>r.name);
for(const name of ['sessions','rooms','submissions','votes','request_limits'])assert(tables.includes(name),'Missing production table: '+name);
db.raw.close();console.log('Sites ESM bundle, asset byte integrity, compression, cache validation and generated production migrations passed.');
