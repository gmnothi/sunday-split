import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {openDb} from './server/sqlite.mjs';
import {createApi} from './server/api.mjs';
import {votesApi} from './server/votes.mjs';
fs.mkdirSync('.sites-runtime',{recursive:true});
const db=openDb('.sites-runtime/social.sqlite');
const catalogs=new Map();
const api=createApi({db,extra:votesApi,catalog:async season=>{if(!catalogs.has(season)){const ctx={window:{}};vm.runInNewContext(fs.readFileSync(`dist/data${season===2025?'-2025':''}.js`,'utf8'),ctx);catalogs.set(season,(season===2025?ctx.window.MATCHUP_POOL_2025:ctx.window.MATCHUP_POOL).rounds);}return catalogs.get(season);}});
const root = path.resolve('dist');
const types = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.txt':'text/plain','.xml':'application/xml'};
const server = http.createServer(async (req,res) => {
  if(req.url.startsWith('/api/')){
    try{const port=server.address().port,origin=`http://127.0.0.1:${port}`;const headers=new Headers(req.headers);headers.set('X-Local-IP',req.socket.remoteAddress||'local');const request=new Request(new URL(req.url,origin),{method:req.method,headers,...(['GET','HEAD'].includes(req.method)?{}:{body:req,duplex:'half'})});const response=await api(request);res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));}catch{res.writeHead(503).end('Service unavailable');}return;
  }
  const file = path.resolve(root, '.' + new URL(req.url,'http://localhost').pathname.replace(/\/$/,'/index.html'));
  if (!file.startsWith(root + path.sep)) {res.writeHead(403).end();return;}
  fs.readFile(file,(err,data)=>{if(err){res.writeHead(404).end('Not found');return;}res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'}).end(data);});
});
server.listen(Number(process.env.PORT || 4317),'127.0.0.1',()=>console.log(`Sunday Split: http://127.0.0.1:${server.address().port}`));
