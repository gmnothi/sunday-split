import assert from 'node:assert/strict';import worker from '../server/worker.mjs';import {openDb} from '../server/sqlite.mjs';
const db=openDb();
const env={DB:db,ASSETS:{async fetch(request){return new URL(request.url).pathname.startsWith('/catalog-')?new Response('[]',{headers:{'Content-Type':'application/json'}}):new Response('static game');}}};
const staticResponse=await worker.fetch(new Request('https://game.test/'),env);assert.equal(await staticResponse.text(),'static game');
const profile=await worker.fetch(new Request('https://game.test/api/session',{method:'POST',headers:{Origin:'https://game.test','Content-Type':'application/json','CF-Connecting-IP':'worker-test'},body:JSON.stringify({name:'Worker player'})}),env);assert.equal(profile.status,201);assert(profile.headers.get('set-cookie').includes('HttpOnly'));assert(profile.headers.get('set-cookie').includes('Secure'));
const missing=await worker.fetch(new Request('https://game.test/api/session'),{...env,DB:null});assert.equal(missing.status,503);db.raw.close();console.log('Worker static routing, API dispatch, secure sessions and missing-database handling passed.');
