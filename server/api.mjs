const json=(value,status=200,headers={})=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store',...headers}});
const fail=(status,message)=>{throw Object.assign(new Error(message),{status});};
const digest=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),b=>b.toString(16).padStart(2,'0')).join('');
const random=()=>crypto.randomUUID().replace(/-/g,'');
async function body(request) {
  const reader=request.body?.getReader();if(!reader)fail(400,'Missing request body');let size=0,parts=[];
  while(true){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>16384){await reader.cancel();fail(413,'Request too large');}parts.push(value);}
  try{const bytes=new Uint8Array(size);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.length;}return JSON.parse(new TextDecoder().decode(bytes));}catch{fail(400,'Invalid JSON');}
}
export async function limit(db,id,now,max=120) {
  const bucket=Math.floor(now/60),row=await db.prepare('INSERT INTO request_limits (id,count,expires) VALUES (?,1,?) ON CONFLICT(id) DO UPDATE SET count=count+1 RETURNING count').bind(id+':'+bucket,now+120).first();
  if(row.count>max)fail(429,'Too many requests. Try again shortly.');
}
export async function session(request,db,now) {
  const token=request.headers.get('Cookie')?.match(/(?:^|;\s*)split_session=([a-f0-9]{64})(?:;|$)/)?.[1];
  if(!token)return null;return db.prepare('SELECT id,name,expires FROM sessions WHERE id=? AND expires>?').bind(await digest(token),now).first();
}
function validateSpec(spec,catalog) {
  if(spec?.v!==1||![2025,2026].includes(spec.season)||spec.keys?.length!==5||new Set(spec.keys).size!==5||!Array.isArray(spec.flips)||spec.flips.length!==5||spec.flips.some(f=>![0,1].includes(f)))fail(400,'A league challenge needs five distinct published matchups.');
  const rounds=spec.keys.map((key,i)=>{const r=catalog.find(r=>r.key===key&&r.season===spec.season);if(!r)fail(400,'This matchup is not in the published pool.');return {...r,teams:spec.flips[i]?[...r.teams].reverse():r.teams};});
  return rounds;
}
export function createApi({db,catalog,now=()=>Math.floor(Date.now()/1000),extra=async()=>null}) {
  return async request=>{
    try {
      const url=new URL(request.url),time=now();
      if(!db)return json({error:'Shared challenges are not configured on this host.'},503);
      if(request.method!=='GET'&&request.headers.get('Origin')!==url.origin)fail(403,'Cross-origin writes are not allowed.');
      if(!['GET','POST'].includes(request.method))fail(405,'Method not allowed');
      const user=await session(request,db,time);
      const ip=request.headers.get('CF-Connecting-IP')||request.headers.get('X-Local-IP')||'unknown';
      await limit(db,'ip:'+await digest(ip),time,240);
      if(user)await limit(db,'session:'+user.id,time,90);
      if(url.pathname==='/api/session'&&request.method==='POST') {
        await limit(db,'new-session:'+await digest(ip),time,20);
        const data=await body(request);const name=typeof data.name==='string'?data.name.trim():'';
        if(name.length<1||name.length>24||/[\x00-\x1f\x7f]/.test(name))fail(400,'Choose a nickname from 1 to 24 characters.');
        if(user){await db.prepare('UPDATE sessions SET name=? WHERE id=?').bind(name,user.id).run();return json({name});}
        const token=random()+random();await db.prepare('INSERT INTO sessions(id,name,expires) VALUES(?,?,?)').bind(await digest(token),name,time+30*86400).run();
        return json({name},201,{'Set-Cookie':`split_session=${token}; Path=/api; HttpOnly; SameSite=Lax; Max-Age=2592000${url.protocol==='https:'?'; Secure':''}`});
      }
      if(url.pathname==='/api/session'&&request.method==='GET')return json({name:user?.name||null});
      if(url.pathname==='/api/rooms'&&request.method==='POST') {
        if(!user)fail(401,'Choose a nickname first.');await limit(db,'rooms:'+user.id,time,6);
        const spec=await body(request),rounds=validateSpec(spec,await catalog(spec.season));
        const token=btoa(JSON.stringify(spec)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
        const id=random();await db.prepare('INSERT INTO rooms(id,host,token,rounds,created,expires) VALUES(?,?,?,?,?,?)').bind(id,user.id,token,JSON.stringify(rounds),time,time+30*86400).run();return json({id,token},201);
      }
      const match=/^\/api\/rooms\/([a-f0-9]{32})(?:\/(scores|submit))?$/.exec(url.pathname);
      if(match){
        const room=await db.prepare('SELECT * FROM rooms WHERE id=? AND expires>?').bind(match[1],time).first();if(!room)fail(404,'Challenge not found or expired.');
        if(!match[2]&&request.method==='GET')return json({id:room.id,token:room.token,expires:room.expires});
        if(!user)fail(401,'Choose a nickname first.');
        if(match[2]==='submit'&&request.method==='POST'){
          const data=await body(request),rounds=JSON.parse(room.rounds);
          if(!Array.isArray(data.picks)||data.picks.length!==5||data.picks.some((p,i)=>!p||![0,1].includes(p.pick)||(p.hint!==null&&(!Number.isInteger(p.hint)||p.hint<0||p.hint>=rounds[i].teams[0].players.length))))fail(400,'Finish all five picks before submitting.');
          const wins=data.picks.filter((p,i)=>p.pick===(rounds[i].teams[0].total>rounds[i].teams[1].total?0:1)).length;
          const assisted=data.picks.filter(p=>p.hint!==null).length;
          const points=data.picks.reduce((n,p,i)=>n+(p.pick===(rounds[i].teams[0].total>rounds[i].teams[1].total?0:1)?p.hint===null?2:1:0),0);
          await db.prepare('INSERT OR IGNORE INTO submissions(room,session,wins,points,assisted,created) VALUES(?,?,?,?,?,?)').bind(room.id,user.id,wins,points,assisted,time).run();
          const stored=await db.prepare('SELECT wins,points,assisted FROM submissions WHERE room=? AND session=?').bind(room.id,user.id).first();return json(stored);
        }
        if(match[2]==='scores'&&request.method==='GET'){
          const played=await db.prepare('SELECT 1 AS played FROM submissions WHERE room=? AND session=?').bind(room.id,user.id).first();if(!played)fail(403,'Finish and submit your five before seeing scores.');
          const scores=await db.prepare('SELECT sessions.name,submissions.wins,submissions.points,submissions.assisted FROM submissions JOIN sessions ON sessions.id=submissions.session WHERE room=? ORDER BY wins DESC,points DESC,created ASC LIMIT 100').bind(room.id).all();return json({scores:scores.results});
        }
      }
      const result=await extra({request,url,user,db,time,catalog,body,json,fail});if(result)return result;
      return json({error:'Not found'},404);
    }catch(error){return json({error:error.status?error.message:'Service unavailable. Try again shortly.'},error.status||503);}
  };
}
