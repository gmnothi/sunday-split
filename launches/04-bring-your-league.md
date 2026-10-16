# Your league has receipts

## Ships
- Enter a public Sleeper league ID to play real completed matchups from that league.
- Restricted to conventional ten-team, one-QB leagues from 2025/2026, matching the existing importer.
- Excludes current partial weeks, ties, commissioner-adjusted points, incomplete starters and inconsistent totals.
- Reuses anti-spoiler pack selection. No owner names, emails, or contact information is imported.
- Shared links re-fetch the league for recipients; availability depends on Sleeper. Recent-form clues can be unavailable for custom scoring.

## Launch Post
Your league's history is now the game.

Drop in your Sleeper league ID and make picks from real past matchups. Send one to the chat and find out who remembers the week their stacked roster lost.

## Verification
`node scripts/test-sleeper-import.mjs` uses mocked API fixtures, including live-week exclusion and adjusted-score rejection. No scraping or guessed IDs.

## Rollout
Depends on Launches 1-3. Imports run on demand through Sleeper's public API; no scheduled collection or production deployment.
