CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  expires INTEGER NOT NULL
);
CREATE TABLE rooms (
  id TEXT PRIMARY KEY,
  host TEXT NOT NULL REFERENCES sessions(id),
  token TEXT NOT NULL,
  rounds TEXT NOT NULL,
  created INTEGER NOT NULL,
  expires INTEGER NOT NULL
);
CREATE TABLE submissions (
  room TEXT NOT NULL REFERENCES rooms(id),
  session TEXT NOT NULL REFERENCES sessions(id),
  wins INTEGER NOT NULL,
  points INTEGER NOT NULL,
  assisted INTEGER NOT NULL,
  created INTEGER NOT NULL,
  PRIMARY KEY (room, session)
);
CREATE TABLE request_limits (
  id TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  expires INTEGER NOT NULL
);
