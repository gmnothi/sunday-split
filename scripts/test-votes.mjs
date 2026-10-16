import assert from 'node:assert/strict';import {openDb} from '../server/sqlite.mjs';import {createApi} from '../server/api.mjs';import {votesApi} from '../server/votes.mjs';
const db=openDb(),key='123456789012345678:5:1',api=createApi({db,extra:votesApi,catalog:async()=>[{key,season:2026}]});
async function call(path,method='GET',body,cookie=''){const res=await api(new Request('https://game.test/api/'+path,{method,headers:{Origin:'https://game.test',Cookie:cookie,'CF-Connecting-IP':'votes-test'},...(body?{body:JSON.stringify(body)}:{})}));return {status:res.status,data:await res.json(),cookie:res.headers.get('set-cookie')?.split(';')[0]};}
assert.equal((await call('votes','POST',{season:2026,key,pick:0})).status,401);
let first;
for(let i=0;i<5;i++){const user=await call('session','POST',{name:'Player '+i});if(!i)first=user.cookie;const vote=await call('votes','POST',{season:2026,key,pick:i%2},user.cookie);assert.equal(vote.data.total,i+1);}
const repeat=await call('votes','POST',{season:2026,key,pick:1},first);assert.equal(repeat.data.total,5);assert.equal(repeat.data.a,3);assert.equal(repeat.data.b,2);assert.equal(repeat.data.yourPick,0);
assert.equal((await call('votes','GET',null,first)).status,405);assert.equal((await call('votes','POST',{season:2026,key:'unknown',pick:0},first)).status,400);
assert.equal((await call('votes','POST',{season:2026,key,pick:2},first)).status,400);db.raw.close();console.log('Real vote totals, one profile/one matchup, immutable first choice, invalid votes and authenticated access passed.');
