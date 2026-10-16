import {createApi} from './api.mjs';
import {votesApi} from './votes.mjs';
import {assets,catalogs} from '../.sites-runtime/sites-assets.mjs';

function bytes(value){const binary=atob(value),result=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)result[i]=binary.charCodeAt(i);return result;}
export default {async fetch(request,env){
  const url=new URL(request.url);
  if(url.pathname.startsWith('/api/'))return createApi({db:env.DB,extra:votesApi,catalog:async season=>catalogs[season]||[],allowedOrigins:['https://sundaysplit.app','https://www.sundaysplit.app','https://sunday-split.othigurman.chatgpt.site']})(request);
  if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405,headers:{Allow:'GET, HEAD'}});
  const asset=assets[url.pathname==='/'?'/index.html':url.pathname];
  if(!asset)return new Response('Not found',{status:404});
  const headers={'Content-Type':asset.type,'Cache-Control':'public, max-age=0, must-revalidate',ETag:asset.etag,'X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin'};
  if(request.headers.get('If-None-Match')===asset.etag)return new Response(null,{status:304,headers});
  return new Response(request.method==='HEAD'?null:bytes(asset.body),{headers:{...headers,'Content-Encoding':'gzip'},encodeBody:'manual'});
}};
