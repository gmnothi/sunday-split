import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const ctx={window:{},document:{addEventListener(){}},Intl,localStorage:{getItem(){return null;},setItem(){}}};vm.runInNewContext(fs.readFileSync(new URL('../dist/wrapped.js',import.meta.url),'utf8'),ctx);
const summarize=ctx.window.SplitWrapped.summarize;
const a={id:'a',date:'2026-10-16',correct:true,margin:5,assisted:false,confidence:5,positions:{QB:true}};
const b={...a,id:'b',date:'2026-10-10',correct:false,margin:30,assisted:true,positions:{QB:false}};
const s=summarize([a,a,b,{...a,id:'old',date:'2026-10-09'},{...a,id:'future',date:'2026-10-17'}],'2026-10-16');
assert.equal(s.played,2);assert.equal(s.accuracy,50);assert.equal(s.biggestMiss,30);assert.equal(s.confidenceEarned,5);assert.equal(s.confidenceStaked,10);assert.equal(s.positions.QB.total,2);assert.equal(summarize([],'2026-10-16').accuracy,null);
console.log('Weekly deduplication, date boundaries, missing stats, confidence and position alignment passed.');
