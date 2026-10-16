import fs from 'node:fs';import {spawnSync} from 'node:child_process';
const features=new Set(['test-game-links.mjs','test-film-room.mjs','test-wrapped.mjs','test-sleeper-import.mjs','test-rooms.mjs','test-votes.mjs','test-worker.mjs']);
for(const file of fs.readdirSync(new URL('./',import.meta.url)).filter(file=>features.has(file)).sort()){
  const result=spawnSync(process.execPath,[new URL(file,import.meta.url).pathname],{stdio:'inherit'});if(result.status!==0)process.exit(result.status||1);
}
