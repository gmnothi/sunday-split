# Six Launches, Six PRs

| Order | Feature | Branch | Production requirement |
| --- | --- | --- | --- |
| 1 | Grudge matches + exact-set score challenges | codex/grudge-match-links | Existing static host |
| 2 | Film Room | codex/film-room | Existing static host |
| 3 | Weekly Wrapped | codex/weekly-wrapped | Existing static host; device-local history |
| 4 | Bring your Sleeper league | codex/bring-your-league | Sleeper public API availability |
| 5 | League challenges | codex/league-challenges | Server runtime + persistent database |
| 6 | The Split / community picks | codex/community-split | Same backend + votes migration |

These are stacked PRs: each targets the preceding branch so reviews show one feature at a time. Merge in order using merge commits, retarget the next PR to main, and only then delete its old base branch. No changes were merged or published as part of creating this stack.

Each launch file includes a post draft, behavior, tests, and rollout caveats. Gate the last two announcements on a successful database-backed staging deployment. The existing static Sites manifest is not silently converted or pointed at a different provider.

## Verification

- `npm run check`: all existing dataset, clue, saved Daily/Confidence, anti-spoiler and scoring regressions.
- `npm run check:social`: all six new feature suites, real SQLite migrations/API behavior, Worker routing, rate limits, oversized requests, frozen scoring and duplicate-submission controls.
- `node server/build-assets.mjs`: builds staging assets and authoritative catalogs without changing the current production manifest.
- `scripts/qa-social.js`: Playwright CLI run-code body for a local server on port 4321. Covers pick/reveal gating, Film Room, weekly PNG download, community sample counts, mobile overflow, two-browser league standings, one-round replay and saved progress. Native sharing is stubbed only for capturing the room invitation during QA.
- A real public ten-team league was imported through the UI from Sleeper: 22 eligible matchups across completed Weeks 1-5; the current partial week stayed excluded.

Browser screenshots and exported test cards are ignored under `output/playwright/`. Runtime SQLite data stays ignored under `.sites-runtime/`.

## Limits

Browser-local Wrapped is not account sync. Anonymous browser profiles and community votes are not verified unique humans. Answers remain public browser assets; these are casual challenges, not an anti-cheat system or prize competition. Shared rooms use frozen published-pool matchups, while on-demand custom league imports can be shared as regular challenge links without server standings.

No cloud database has been provisioned, and a production Worker/D1 deployment has not been tested in this task. The portable API, persistence, migrations and cross-browser flow are tested locally. Treat backend provisioning and staging as a release gate, not as completed infrastructure.
