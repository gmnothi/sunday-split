import assert from 'node:assert/strict';
import {openDb} from '../server/sqlite.mjs';
import {createApi} from '../server/api.mjs';
const db=openDb();let time=1800000000;
const catalog=Array.from({length:5},(_,i)=>({key:`123456789012345678:5:${i+1}`,season:2026,teams:[{total:100,players:[{points:100}]},{total:90,players:[{points:90}]}]}));
const api=createApi({db,catalog:async()=>catalog,now:()=>time});
async function call(path,method='GET',data,cookie='',origin='https://game.test'){
  const request=new Request('https://game.test/api/'+path,{method,headers:{Origin:origin,Cookie:cookie,'CF-Connecting-IP':'test-'+cookie.slice(-8),'Content-Type':'application/json'},...(data===undefined?{}:{body:JSON.stringify(data)})});const response=await api(request);return {status:response.status,data:await response.json(),cookie:response.headers.get('set-cookie')?.split(';')[0]};
}
const host=await call('session','POST',{name:'Host'});assert.equal(host.status,201);assert(!host.data.id);assert(host.cookie);
const friend=await call('session','POST',{name:'Friend'});
assert.equal((await call('rooms','POST',{},'')).status,401);
assert.equal((await call('rooms','POST',{},host.cookie,'https://evil.test')).status,403);
const spec={v:1,season:2026,keys:catalog.map(r=>r.key),flips:[0,1,0,1,0]};
assert.equal((await call('rooms','POST',{...spec,keys:['fake',...spec.keys.slice(1)]},host.cookie)).status,400);
const room=await call('rooms','POST',{...spec,points:999},host.cookie);assert.equal(room.status,201);assert(!JSON.parse(atob(room.data.token.replace(/-/g,'+').replace(/_/g,'/'))).points);
const metadata=await call('rooms/'+room.data.id);assert(!('rounds' in metadata.data));assert(!JSON.stringify(metadata.data).includes('total'));
assert.equal((await call(`rooms/${room.data.id}/scores`,'GET',undefined,friend.cookie)).status,403);
assert.equal((await call(`rooms/${room.data.id}/submit`,'POST',{picks:[{pick:0,hint:null}]},friend.cookie)).status,400);
const picks=spec.flips.map(pick=>({pick,hint:null}));
const submission=await call(`rooms/${room.data.id}/submit`,'POST',{picks,wins:0,points:999},friend.cookie);assert.equal(submission.data.wins,5);assert.equal(submission.data.points,10);
const retry=await call(`rooms/${room.data.id}/submit`,'POST',{picks:picks.map(p=>({...p,pick:1-p.pick}))},friend.cookie);assert.equal(retry.data.wins,5,'First submission must be immutable');
assert.equal((await call(`rooms/${room.data.id}/scores`,'GET',undefined,friend.cookie)).data.scores[0].name,'Friend');
assert.equal((await call(`rooms/${room.data.id}/scores`,'GET',undefined,host.cookie)).status,403);
assert.equal((await call('session','POST',{name:'x'.repeat(17000)},host.cookie)).status,413);
let rateStatus=200;for(let i=0;i<100;i++)rateStatus=(await call('session','GET',undefined,friend.cookie)).status;assert.equal(rateStatus,429,'Session rate limit must be enforced');
time+=31*86400;assert.equal((await call('rooms/'+room.data.id)).status,404);
db.raw.close();console.log('Room sessions, CSRF, authoritative scoring, side flips, hidden standings, immutable submissions and expiry passed.');
