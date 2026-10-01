# Sunday Split Prototype

Five fixed real 2026 Week 3 matchups from 10-team Sleeper leagues. Both starting lineups are visible; one optional paired-slot hint per round. Correct picks earn 2 points unassisted or 1 with a hint. Incorrect picks earn 0. Grouped score reveals run in a fixed position order, with skip and reduced-motion controls.

Reveals take roughly 12 seconds; margins of 5 points or less add a suspense hold and a slower final tally (about 15 seconds total). Paired rows enter together, position groups are highlighted, and correct picks receive a brief confetti celebration. Refresh recovery and skipped/reduced-motion reveals do not replay celebrations.

Run `npm install`, then `npm start`; open http://127.0.0.1:4317. `npm run check` validates the fixture totals. Static output is in `dist/`.

Data is a snapshot, not a daily updater. Import script retains source endpoint URLs and removes league-owner identities. Week-specific NFL opponents are not yet enriched. Sleeper headshot URLs are undocumented and have initials fallbacks. Image rights and commercial API licensing must be clarified before public launch.

Progress is saved only on this device. Replay resets this fixed pack. Scores are shipped in browser assets for this prototype; competitive production play requires server-side answer validation. No accounts, leaderboards, or automatic daily refresh are implemented.
