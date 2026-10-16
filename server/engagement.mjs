import {validateSpec} from './api.mjs';
import {votesApi} from './votes.mjs';

export async function engagementApi(context) {
  const {request,url,user,db,time,catalog,body,json,fail}=context;
  if(url.pathname==='/api/rivalries'&&request.method==='GET'){
    if(!user)fail(401,'Choose a nickname first.');
    // Only compare sets both profiles submitted. Old submissions without picks remain score-only.
    const rows=await db.prepare(`SELECT rooms.token,rooms.rounds,sessions.name,other.session,
      mine.wins AS mine_wins,mine.points AS mine_points,mine.picks AS mine_picks,
      other.wins AS other_wins,other.points AS other_points,other.picks AS other_picks
      FROM submissions mine JOIN submissions other ON other.room=mine.room AND other.session<>mine.session
      JOIN rooms ON rooms.id=mine.room JOIN sessions ON sessions.id=other.session
      WHERE mine.session=? AND rooms.expires>? AND sessions.expires>?
      ORDER BY mine.created DESC LIMIT 200`).bind(user.id,time,time).all();
    const rivals=new Map(),seen=new Set();
    for(const row of rows.results){
      const unique=row.session+':'+row.token;if(seen.has(unique))continue;seen.add(unique);
      let rival=rivals.get(row.session);if(!rival){rival={name:row.name,sets:0,comparedSets:0,yourWins:0,theirWins:0,ties:0,disagreements:0,yourCalls:0,theirCalls:0};rivals.set(row.session,rival);}
      rival.sets++;const edge=row.mine_wins-row.other_wins||row.mine_points-row.other_points;
      rival[edge>0?'yourWins':edge<0?'theirWins':'ties']++;
      if(row.mine_picks&&row.other_picks){
        rival.comparedSets++;
        const mine=JSON.parse(row.mine_picks),other=JSON.parse(row.other_picks),rounds=JSON.parse(row.rounds);
        mine.forEach((p,i)=>{if(p.pick!==other[i].pick){rival.disagreements++;const winner=rounds[i].teams[0].total>rounds[i].teams[1].total?0:1;rival[p.pick===winner?'yourCalls':'theirCalls']++;}});
      }
    }
    return json({rivals:[...rivals.values()],window:'Up to 200 recent shared-room entries from active 30-day browser profiles. Identical sets count once per opponent.'});
  }
  if(url.pathname==='/api/debrief'&&request.method==='POST'){
    if(!user)fail(401,'Choose a nickname first.');
    const data=await body(request),rounds=validateSpec(data,await catalog(data.season));
    if(!Array.isArray(data.picks)||data.picks.length!==5||data.picks.some(p=>![0,1].includes(p)))fail(400,'Finish your five before opening the debrief.');
    await db.batch(rounds.map((r,i)=>db.prepare('INSERT OR IGNORE INTO votes(session,matchup,pick,created) VALUES(?,?,?,?)').bind(user.id,r.key,data.flips[i]?1-data.picks[i]:data.picks[i],time)));
    const reports=[];
    for(let i=0;i<rounds.length;i++){
      const rows=await db.prepare('SELECT pick,COUNT(*) AS total FROM votes WHERE matchup=? GROUP BY pick').bind(rounds[i].key).all();
      const a=rows.results.find(r=>r.pick===0)?.total||0,b=rows.results.find(r=>r.pick===1)?.total||0,total=a+b;
      const canonicalWinner=(rounds[i].teams[0].total>rounds[i].teams[1].total?0:1)^data.flips[i];
      reports.push({index:i,total,pickedA:total>=5?Math.round((data.flips[i]?b:a)/total*100):null,winnerShare:total>=5?Math.round((canonicalWinner===0?a:b)/total*100):null});
    }
    return json({rounds:reports});
  }
  return votesApi(context);
}
