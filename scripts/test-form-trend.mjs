import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const ctx={window:{}};
vm.runInNewContext(fs.readFileSync(new URL('../dist/form-trend.js',import.meta.url),'utf8'),ctx);
const {model,markup}=ctx.window.FormTrend;
const games=values=>values.map((points,i)=>({season:2026,week:i+1,points})).reverse();
assert.equal(model(games([5,10,20])).direction,'up');
assert.equal(model(games([20,10,5])).direction,'down');
assert.equal(model(games([10,25,10])).direction,'flat');
assert.equal(model(games([7])).direction,'limited');
assert.equal(model(games([-3,0,3])).direction,'up');
assert.equal(model(games([10,10.01])).direction,'up');
assert(model(games([10,10.01])).points[0].y-model(games([10,10.01])).points[1].y<.01);
assert.equal(model([]),null);
assert.equal(model(games([NaN])),null);
assert.equal(model(games([1,2,3,4])),null);
const cross=[{season:2026,week:1,points:20},{season:2025,week:18,points:10}];
assert.equal(model(cross).delta,10);
assert(markup(cross).includes('Oldest to latest'));
assert.equal(cross[0].season,2026,'Input mutated');
for(const season of [2025,2026]) {
  vm.runInNewContext(fs.readFileSync(new URL('../dist/clues-'+season+'.js',import.meta.url),'utf8'),ctx);
  for(const form of Object.values(ctx.window.LINEUP_CLUES[season].form)) {
    const m=model(form.games);if(!form.games.length){assert.equal(m,null);continue;}
    assert(m.points.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.y>=3&&p.y<=17));
    assert.equal(m.values[0],form.games.at(-1).points);
    assert.equal(m.values.at(-1),form.games[0].points);
  }
}
console.log('Trend direction, chronological order, scale, missing history and both season clue packs passed.');
