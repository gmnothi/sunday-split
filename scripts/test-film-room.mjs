import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const ctx={window:{},document:{addEventListener(){}}};vm.runInNewContext(fs.readFileSync(new URL('../dist/film-room.js',import.meta.url),'utf8'),ctx);
const r={teams:[{total:20,players:[{player_id:'a',points:20}]},{total:21,players:[{player_id:'b',points:21}]}]};
const full={player:(_,id)=>({average:id==='a'?25:10,games:[1,2,3]})};
const report=ctx.window.FilmRoom.analyze(r,full);assert.equal(report.winner,1);assert.equal(report.baselineWinner,0);assert.equal(report.swings[0].delta,11);
assert.equal(ctx.window.FilmRoom.analyze(r,{player:()=>({average:0,games:[]})}).complete,false);
assert.equal(ctx.window.FilmRoom.analyze(r,null).baselineWinner,null);
console.log('Film Room baseline reversals, zero/missing history and score departures passed.');
