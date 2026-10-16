import assert from 'node:assert/strict';

export function lastCompletedWeek(state) {
  assert(['pre','regular','post','off'].includes(state.season_type),'Unknown season phase');
  if(state.season_type==='pre')return 0;
  if(state.season_type!=='regular')return 18;
  assert(Number.isInteger(state.week)&&state.week>=1&&state.week<=19,'Invalid current week');
  return Math.min(18,state.week-1);
}

export function nextDailyDate(now=new Date()) {
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Toronto',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
  const next=new Date(today+'T00:00:00Z');
  next.setUTCDate(next.getUTCDate()+1);
  return next.toISOString().slice(0,10);
}
