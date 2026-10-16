# Challenge your league

## Ships
- Create an invite-only-by-link room from a completed published five-round set.
- Anonymous browser nicknames. No account required. Room access expires after 30 days.
- The server calculates scores against its frozen matchup snapshot; client-supplied totals are ignored.
- Submit all five before standings unlock. First submission wins, including on concurrent retries.
- Basic per-IP/session rate limits, secure HttpOnly production cookies, same-origin write checks, bounded request bodies, and parameterized SQL.

## Launch Post
Five matchups. Your whole league. One scoreboard.

Finish your Sunday Split, start a league challenge, and drop the link in the chat. Everyone gets the same five. No peeking at the standings until your picks are in.

## Verification
`node scripts/test-rooms.mjs` exercises the real SQLite schema and API: anonymous sessions, foreign-origin rejection, frozen authoritative scores, hidden standings, duplicate submissions and expiry.

## Rollout / Hosting Gate
Depends on Launches 1-4. The current production Site is static: do not advertise shared rooms until its server runtime and database are deployed. No production infrastructure or audience is changed by this PR.

`npm start` runs the full app and API locally on Node 22.13+ using persistent `.sites-runtime/social.sqlite`. Local migrations run at startup, never in request handlers.

A Cloudflare Workers + D1 entrypoint and `wrangler.jsonc` are included for staging. Run `node server/build-assets.mjs`, provision D1 with Wrangler, populate the real database ID returned by Cloudflare in `wrangler.jsonc`, and apply `server/migrations` before deploying. No fabricated database ID is committed. For Sites, prepare a Worker-compatible migration and provision a logical DB binding through the existing Site before publishing; the static hosting manifest is intentionally unchanged. Do not deploy the static artifact and expect `/api` to work.

Rooms currently support published datasets, not on-demand custom imports. They're casual games, not verified competitions: historical answers are shipped in public browser assets, and anonymous profiles can be recreated. No prizes or anti-cheat claims.
