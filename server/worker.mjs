import {createApi} from './api.mjs';
import {engagementApi} from './engagement.mjs';
const catalogs=new Map();
export default {async fetch(request,env){
  if(!new URL(request.url).pathname.startsWith('/api/'))return env.ASSETS.fetch(request);
  return createApi({db:env.DB,extra:engagementApi,catalog:async season=>{
    if(!catalogs.has(season)){const response=await env.ASSETS.fetch(new Request(new URL(`/catalog-${season}.json`,request.url)));if(!response.ok)throw new Error('Missing matchup catalog');catalogs.set(season,await response.json());}return catalogs.get(season);
  }})(request);
}};
