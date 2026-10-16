import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const ctx={window:{SplitSocial:{}},document:{addEventListener(){}}};vm.runInNewContext(fs.readFileSync(new URL('../dist/extras.js',import.meta.url),'utf8'),ctx);
const extras=ctx.window.SplitExtras;
const round={teams:[{total:28,players:[{slot:'QB',points:10},{slot:'FLEX',points:8},{slot:'WR',points:7},{slot:'K',points:3}]},{total:26,players:[{slot:'QB',points:4},{slot:'FLEX',points:10},{slot:'WR',points:9},{slot:'K',points:3}]}]};
assert.deepEqual([...extras.remaining(round)],[1,2]);assert.equal(extras.caseOutcome(round,{side:0,row:0}),true);assert.equal(extras.caseOutcome(round,{side:1,row:0}),false);assert.equal(extras.caseOutcome(round,{side:0,row:1}),false);assert.equal(extras.caseOutcome(round,{side:3,row:0}),null);
round.teams[0].players[1].points=16;assert.equal(extras.caseOutcome(round,{side:0,row:1}),true,'Tied biggest edges both count');
ctx.window.PlayerClues={player:()=>({average:13.2,games:[1,2,3],opponent:{team:'SEA',opponent:'LAR',home:true}})};ctx.window.FormTrend={markup:()=>'<span>trend</span>'};ctx.window.SplitSocial.esc=String;
// Reload to capture the escape helper in the module closure.
vm.runInNewContext(fs.readFileSync(new URL('../dist/extras.js',import.meta.url),'utf8'),ctx);
const hidden=ctx.window.SplitExtras.blindPlayer({name:'Secret Name',player_id:'secret-id'},0,0,'QB',round);
assert(!hidden.includes('Secret Name'));assert(!hidden.includes('secret-id'));assert(!hidden.includes('thumb/'));assert(hidden.includes('13.20'));assert(hidden.includes('SEA vs LAR'));
console.log('Fourth Quarter slots are outcome-independent; side-call ties and invalid choices; Blind Resume identity hiding passed.');
