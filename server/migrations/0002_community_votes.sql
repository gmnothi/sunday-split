CREATE TABLE votes (
  session TEXT NOT NULL REFERENCES sessions(id),
  matchup TEXT NOT NULL,
  pick INTEGER NOT NULL CHECK(pick IN (0,1)),
  created INTEGER NOT NULL,
  PRIMARY KEY (session, matchup)
);
CREATE INDEX votes_matchup ON votes(matchup);
