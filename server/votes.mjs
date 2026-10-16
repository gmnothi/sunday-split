import {limit} from './api.mjs';
export async function votesApi({request,url,user,db,time,catalog,body,json,fail}) {
  if(url.pathname!=='/api/votes')return null;
  if(!user)fail(401,'Choose a nickname first.');
  if(request.method!=='POST')fail(405,'Submit a locked pick to see the split.');
  await limit(db,'votes:'+user.id,time,60);
  const data=await body(request);
  if(![2025,2026].includes(data.season)||typeof data.key!=='string'||data.key.length>80||![0,1].includes(data.pick))fail(400,'Invalid vote.');
  const round=(await catalog(data.season)).find(r=>r.key===data.key);
  if(!round)fail(400,'Community picks are available for published matchups only.');
  await db.prepare('INSERT OR IGNORE INTO votes(session,matchup,pick,created) VALUES(?,?,?,?)').bind(user.id,data.key,data.pick,time).run();
  const own=await db.prepare('SELECT pick FROM votes WHERE session=? AND matchup=?').bind(user.id,data.key).first();
  const counts=await db.prepare('SELECT pick,COUNT(*) AS total FROM votes WHERE matchup=? GROUP BY pick').bind(data.key).all();
  const a=counts.results.find(r=>r.pick===0)?.total||0,b=counts.results.find(r=>r.pick===1)?.total||0;
  return json({a,b,total:a+b,yourPick:own.pick});
}
