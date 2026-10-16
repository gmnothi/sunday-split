import {DatabaseSync} from 'node:sqlite';
import fs from 'node:fs';
export function openDb(path=':memory:') {
  const raw=new DatabaseSync(path);raw.exec('PRAGMA foreign_keys=ON');
  raw.exec('CREATE TABLE IF NOT EXISTS migrations(name TEXT PRIMARY KEY)');
  const dir=new URL('./migrations/',import.meta.url);
  for(const name of fs.readdirSync(dir).filter(n=>n.endsWith('.sql')).sort())if(!raw.prepare('SELECT 1 FROM migrations WHERE name=?').get(name)){raw.exec('BEGIN');try{raw.exec(fs.readFileSync(new URL(name,dir),'utf8'));raw.prepare('INSERT INTO migrations(name) VALUES(?)').run(name);raw.exec('COMMIT');}catch(error){raw.exec('ROLLBACK');throw error;}}
  return {raw,prepare(sql){return {bind(...values){return {async first(){return raw.prepare(sql).get(...values)||null;},async all(){return {results:raw.prepare(sql).all(...values)};},async run(){const result=raw.prepare(sql).run(...values);return {meta:{changes:Number(result.changes)}};}};}};}};
}
