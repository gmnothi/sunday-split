# Six Launches, Six PRs

| Order | Feature | Branch | Production requirement |
| --- | --- | --- | --- |
| 1 | Grudge matches + exact-set score challenges | codex/grudge-match-links | Existing static host |
| 2 | Film Room | codex/film-room | Existing static host |
| 3 | Weekly Wrapped | codex/weekly-wrapped | Existing static host; device-local history |
| 4 | Bring your Sleeper league | codex/bring-your-league | Sleeper public API availability |
| 5 | League challenges | codex/league-challenges | Server runtime + persistent database |
| 6 | The Split / community picks | codex/community-split | Same backend + votes migration |

The six PRs were reviewed as a stack, then retargeted and merged into main in order on October 16, 2026. The production integration uses the existing Sites project with an ESM Worker and the logical `DB` binding; generated Drizzle migrations provision the shared-play schema at publication.

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

The production build adds Worker/D1 validation on top of the portable tests: `npm run build`, `npm run check:sites`, and the local Wrangler preview all use the generated production migrations. Record final native deployment status and live shared-play verification in the release handoff; merging code alone is not evidence of publication.
