# The Split

## Ships
- Real aggregate community picks, visible only after your matchup reveal.
- Canonical-side vote storage keeps A/B percentages correct when shared links flip lineups.
- First vote is immutable per anonymous browser profile and matchup. Replays cannot add votes.
- Percentages are withheld below five votes, with the real sample size shown instead.
- No fake seed votes, invented percentages, or unique-human claims. Recreated profiles remain a known limitation.

## Launch Post
Was it an obvious pick, or did everyone get fooled?

The Split is here. Make your call, watch the reveal, then see how the community voted. Real picks. Real sample sizes. No crowd hints before you lock in.

## Verification
`node scripts/test-votes.mjs` covers real counts, replay deduplication, first-vote immutability, authentication and invalid inputs. Launch-stack browser tests cover reveal gating and mobile layout.

## Rollout
Depends on Launch 5's backend and database, plus migration `0002_community_votes.sql`. Deploy the server runtime and apply migrations before this launch. Current static production remains unchanged.
