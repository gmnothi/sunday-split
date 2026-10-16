# Film Room

## Ships
- Post-reveal Film Room with every starter's actual points, prior-game average, sample size, and departure.
- A team baseline comparison only when every starter has three prior games.
- Missing history is explicit. No projected win probabilities or fabricated expected scores.

## Launch Post
Got the pick wrong? Run the tape.

Sunday Split's Film Room shows who beat their recent form, who disappointed, and when the historical baseline pointed the wrong way. Available after your pick, never before the reveal.

## Verification
`node scripts/test-film-room.mjs`; launch-stack browser test covers locked picks and the Film Room dialog.

## Rollout
Depends on Launch 1's game events and shared dialog controls. No production deployment in this PR.
