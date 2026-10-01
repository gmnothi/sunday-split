import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve('dist');
const types = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml'};
const server = http.createServer((req,res) => {
  const file = path.resolve(root, '.' + new URL(req.url,'http://localhost').pathname.replace(/\/$/,'/index.html'));
  if (!file.startsWith(root + path.sep)) {res.writeHead(403).end();return;}
  fs.readFile(file,(err,data)=>{if(err){res.writeHead(404).end('Not found');return;}res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'}).end(data);});
});
server.listen(Number(process.env.PORT || 4317),'127.0.0.1',()=>console.log('Sunday Split: http://127.0.0.1:4317'));
