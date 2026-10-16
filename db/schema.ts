import {sql} from 'drizzle-orm';
import {sqliteTable,text,integer,primaryKey,index,check} from 'drizzle-orm/sqlite-core';

export const sessions=sqliteTable('sessions',{
  id:text('id').primaryKey(),name:text('name').notNull(),expires:integer('expires').notNull(),
});
export const rooms=sqliteTable('rooms',{
  id:text('id').primaryKey(),host:text('host').notNull().references(()=>sessions.id),
  token:text('token').notNull(),rounds:text('rounds').notNull(),created:integer('created').notNull(),expires:integer('expires').notNull(),
});
export const submissions=sqliteTable('submissions',{
  room:text('room').notNull().references(()=>rooms.id),session:text('session').notNull().references(()=>sessions.id),
  wins:integer('wins').notNull(),points:integer('points').notNull(),assisted:integer('assisted').notNull(),created:integer('created').notNull(),
},t=>[primaryKey({columns:[t.room,t.session]})]);
export const requestLimits=sqliteTable('request_limits',{
  id:text('id').primaryKey(),count:integer('count').notNull(),expires:integer('expires').notNull(),
});
export const votes=sqliteTable('votes',{
  session:text('session').notNull().references(()=>sessions.id),matchup:text('matchup').notNull(),pick:integer('pick').notNull(),created:integer('created').notNull(),
},t=>[primaryKey({columns:[t.session,t.matchup]}),index('votes_matchup').on(t.matchup),check('votes_valid_pick',sql`${t.pick} IN (0,1)`)]);
