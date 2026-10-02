# Sunday Split

A snapshot pool of 528 real 2026 Week 1-3 matchups from 37 ten-team Sleeper leagues. Includes 62 finishes within five points and 102 more within fifteen points. Everyone receives the same date-seeded daily set of five, resetting on the next visit after midnight America/Toronto. Practice sets prioritize unseen matchups on this device, then reuse the pool when depleted. Daily and practice progress are stored separately. Team sides are shuffled deterministically per pack, with no alternating winner pattern.

Both starting lineups are visible; one optional paired-slot hint per round. Correct picks earn 2 points unassisted or 1 with a hint. Incorrect picks earn 0. Grouped score reveals run in a fixed position order, with skip and reduced-motion controls.

Starting October 2, 2026, daily packs target two close wins, two competitive wins, and one comfortable win, with unique-matchup fallback when a category is depleted. Earlier daily selections remain unchanged. Daily pack selections are saved locally alongside progress. Practice uses the same weighting; Endless still covers the full pool.

Daily streaks count consecutive completed five-round games, regardless of score. An unfinished today preserves yesterday's streak; a missed calendar day breaks it. Current streak, best streak, and days played are saved on this device, and existing completed daily records are migrated. Practice and Endless do not extend daily streaks. Spoiler-free shares include the daily streak and the custom domain.

Endless mode (`?endless=1`) continues beyond five rounds, with running points, correct picks, accuracy, and current streak. A device-local seed preserves round order and lineup sides across refreshes and days. Every matchup appears once per 528-round cycle before the pool reshuffles; cycle boundaries avoid an immediate repeat. Pool expansions start a fresh Endless run rather than interpreting saved answers against a changed sequence. Daily and Practice progress remain intact. Endless progress is separate from Daily and Practice, and a wrong pick does not end the run.

Reveals take roughly 12 seconds; margins of 5 points or less add a suspense hold and a slower final tally (about 15 seconds total). Paired rows enter together, position groups are highlighted, and correct picks receive a brief confetti celebration. Refresh recovery and skipped/reduced-motion reveals do not replay celebrations.

Run `npm install`, then `npm start`; open http://127.0.0.1:4317. `npm run check` validates the fixture totals. Static output is in `dist/`.

Browser layout regression: with the local server and a Playwright CLI session open, run `playwright-cli run-code "$(< scripts/qa-lineups.js)"`. The audit checks every matchup fixture at 12 widths, with hidden scores, active reveals, and hints, for portrait boundaries, paired alignment, text overlaps, and horizontal overflow. It replaces test-page roster content; reload before further gameplay checks.

Data is a manually refreshed snapshot. Run `npm run refresh:pool` to discover publicly posted invites and completed drafts from `scripts/league-sources.json`, then validate actual matchups through Sleeper's API. The importer is intentionally limited to completed 2026 Weeks 1-3; it never imports live Week 4 scores. Existing rounds are immutable, and the October 1 daily set uses the original 72-round pool. Eligible leagues have ten teams, one QB, up to twelve conventional starting slots, and no Superflex, IDP, best ball, or bonus scoring. Ties, adjusted scores, incomplete lineups, and totals that don't match starter scores are excluded. `research/pool-refresh-report.json` records exclusions and discovery sources. Runs with no additions leave the shipped pool unchanged.

The browser rotates daily sets from that snapshot, balancing margin classes. Imported rounds retain source endpoint URLs but no league-owner identities. Week-specific NFL opponents are not yet enriched. Sleeper headshot URLs are undocumented and have initials fallbacks. Image rights and commercial API licensing must be clarified.

Progress is saved only on this device. Scores are shipped in browser assets for this prototype; competitive production play requires server-side answer validation. No accounts, leaderboards, or automatic live-data imports are implemented.
