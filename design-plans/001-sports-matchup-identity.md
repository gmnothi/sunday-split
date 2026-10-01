# Sunday Split Sports Matchup Identity

Written against: ed530fb

## Evidence chain

- Surface: `/`, daily and practice matchup, reveal, and final session summary.
- User-selected design: a mix of Sleeper and ESPN with its own identity; preserve the already approved five head-to-head rounds, hint, suspense, and practice pool.
- Owner: `dist/index.html`, `dist/app.js`, `dist/style.css`; index loads app and stylesheet directly.
- Existing tokens: charcoal `--bg`, teal `--a`, coral `--b`, Inter body and Barlow Condensed display type.
- Existing mobile branch (`style.css` lines 11-13) shrinks metadata to 8-9px; scores become absolutely positioned at the bottom of player rows. This is the target for a more legible sports-table treatment, not a change to scoring or data.
- Existing team headings (`app.js` render scoreboard) claim home/away sides even though imported data represents anonymous fantasy roster IDs, not documented home/away assignments. Replace with neutral lineup identity.
- Uncertainty: visual balance, long-name fitting, sticky reveal framing need browser verification by executor.

## Design decision

Build a broadcast desk with a crisp light roster table: charcoal masthead and scoreboard, cool light-gray page background, white comparison rows, teal and coral lineup identifiers. Use Sleeper-like paired roster clarity and ESPN-like sports typography and score hierarchy as inspiration, not logos, exact layouts, or proprietary assets. Keep Sunday Split's existing palette and player images.

## Reuse

- Reuse existing DOM IDs, player rows, `data-side`, `data-hint`, game state, Lucide icons, deterministic pack picker, score counters, and reduced-motion control.
- Exemplar: existing `.team-a`, `.team-b`, `.player`, `.paired-row`, `.progress`, `.scoreboard` and `.result` compositions.

## Changes

1. `dist/style.css`: replace compressed override-heavy stylesheet with a coherent token-driven stylesheet; explicit responsive breakpoints. White roster rows, charcoal score band, restrained teal/coral tint, thin separators, stable score-column dimensions, position chips. Buttons and tooltips remain recognizable, squared radius <=6px. Main player names 15-16px desktop, at least 13px narrow mobile; regular controls 14px, secondary labels preferably 12px. Do not scale fonts with viewport width or use negative letter spacing. Avoid nested cards, marketing hero, decorative gradients, or orbs.
2. `dist/index.html`: retain working app and script sequence. Refine brand masthead and expose usable Daily/Practice navigation; active treatment must match current mode. No fake links or leaderboard/streak controls. Keep prototype/season labeling accurate.
3. `dist/app.js`: presentation-only DOM/copy changes. Use neutral Lineup A/Lineup B headings with corresponding team identity. Refine progress, scoreboard, result, summary and hint bar. Navigation must preserve daily progress, and practice must keep independent set IDs and storage. Prefer a helper for generating a new practice URL reused by navigation and Play another five.
4. Motion: keep ~12-second normal / ~15-second close reveal schedule, fixed real position order, authentic numeric scores, skip, hint, confetti and instant reduced motion. Preserve/extend deliberate easing without introducing dependencies. No sound, fabricated live status, fake projections, or invented historical opponents.

## Scope

- Include current daily, practice, selecting hint, pre-pick, reveal, final round result, full summary.
- Exclude data import, backend, accounts, licensing, new game rules, and unrelated parent Cineplex project.

## Validation

- `npm run check` must pass unchanged data validation.
- Browser checks at 320, 390, 768 and 1440px: no horizontal overflow; player names and score values fit; 10-starter round and long names are readable; reveal totals and suspense remain visible; fixed mobile reveal control must not hide the result action.
- Play all five rounds in reduced motion, confirm scoring and summary, choose paired hint, return from practice to daily with saved daily results, and reload practice without changing lineups.
- Capture and inspect desktop/mobile pre-pick, close suspense and summary screenshots. Check page errors.

## Stop conditions

- Do not change core game rules, scoring, deterministic pools or historical data to accommodate styling.
- Do not publish, mutate Sites identity, or edit outside the three product files in the implementation task. Return changed paths and verification results to owner.

## Design documentation

- This plan records the user's accepted new visual direction; no separate design document needed.
