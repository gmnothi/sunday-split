import assert from 'node:assert/strict';import {openDb} from '../server/sqlite.mjs';import {createApi} from '../server/api.mjs';import {engagementApi} from '../server/engagement.mjs';
const db=openDb();let time=1800000000;
const catalog=Array.from({length:5},(_,i)=>({key:`123456789012345678:5:${i+1}`,season:2026,teams:[{total:100,players:[null]},{total:90,players:[null]}]}));
const api=createApi({db,catalog:async()=>catalog,extra:engagementApi,now:()=>time});
async function call(path,method='GET',data,cookie=''){const response=await api(new Request('https://game.test/api/'+path,{method,headers:{Origin:'https://game.test',Cookie:cookie,'CF-Connecting-IP':cookie||'test'},...(data===undefined?{}:{body:JSON.stringify(data)})}));return {status:response.status,data:await response.json(),cookie:response.headers.get('Set-Cookie')?.split(';')[0]};}
const host=await call('session','POST',{name:'Host'}),friend=await call('session','POST',{name:'Friend'}),stranger=await call('session','POST',{name:'Stranger'});
assert.equal((await call('rivalries')).status,401);
const spec={v:1,season:2026,keys:catalog.map(r=>r.key),flips:[0,1,0,1,0]};
assert.equal((await call('rooms','POST',{...spec,title:'x'.repeat(61)},host.cookie)).status,400);
const room=await call('rooms','POST',{...spec,title:'My weekly five'},host.cookie);assert.equal(room.status,201);
const metadata=await call('rooms/'+room.data.id);assert.equal(metadata.data.title,'My weekly five');assert(metadata.data.week);assert(!JSON.stringify(metadata.data).includes('total'));
const mine=spec.flips.map(pick=>({pick,hint:null})),theirs=mine.map((p,i)=>({...p,pick:i<2?1-p.pick:p.pick}));
await call(`rooms/${room.data.id}/submit`,'POST',{picks:mine},host.cookie);
assert.equal((await call('rivalries','GET',undefined,host.cookie)).data.rivals.length,0);
await call(`rooms/${room.data.id}/submit`,'POST',{picks:theirs},friend.cookie);
let rivals=(await call('rivalries','GET',undefined,host.cookie)).data.rivals;assert.equal(rivals.length,1);assert.equal(rivals[0].yourWins,1);assert.equal(rivals[0].disagreements,2);assert.equal(rivals[0].yourCalls,2);assert(!('session' in rivals[0]));
assert.equal((await call('rivalries','GET',undefined,stranger.cookie)).data.rivals.length,0,'Unrelated profiles must see no rivalry data');
await call(`rooms/${room.data.id}/submit`,'POST',{picks:mine},friend.cookie);assert.equal((await call('rivalries','GET',undefined,host.cookie)).data.rivals[0].yourWins,1,'First picks remain immutable');
const duplicate=await call('rooms','POST',spec,host.cookie);for(const [user,picks] of [[host,mine],[friend,theirs]])await call(`rooms/${duplicate.data.id}/submit`,'POST',{picks},user.cookie);
assert.equal((await call('rivalries','GET',undefined,host.cookie)).data.rivals[0].sets,1,'Identical rooms must not double count sets');
assert.equal((await call('debrief','POST',{...spec,picks:[0]},host.cookie)).status,400);
const report=await call('debrief','POST',{...spec,picks:spec.flips},host.cookie);assert.equal(report.status,200);assert.equal(report.data.rounds[0].total,1);assert.equal(report.data.rounds[0].pickedA,null);
for(let i=0;i<4;i++){const user=await call('session','POST',{name:'Voter '+i});await call('debrief','POST',{...spec,picks:spec.flips},user.cookie);}
const full=await call('debrief','POST',{...spec,picks:spec.flips.map(p=>1-p)},host.cookie);assert.equal(full.data.rounds[0].total,5);assert.equal(full.data.rounds[0].winnerShare,100);assert.equal(full.data.rounds[1].pickedA,0,'Flipped sides map to displayed B');
await call('session','DELETE',undefined,friend.cookie);assert.equal((await call('rivalries','GET',undefined,host.cookie)).data.rivals.length,0);
time+=31*86400;assert.equal((await call('rooms/'+room.data.id)).status,404);db.raw.close();
console.log('Creator title validation, frozen sets, private rivalries, immutable pick comparisons, deduplication, real debrief samples and flips passed.');
