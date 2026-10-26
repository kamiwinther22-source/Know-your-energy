# Numerology chart and results page: design work (26 Oct)

NOT on the live site. Pictures and the scripts that made them. Pictures use the owner's own birth data (Kami Sue Freeman, 11/14/1977, 6:46 pm); do not merge this folder into `main`.

## Decided
- Chart C: rows with rules, cursive section names, italic black numbers, exactly two phone screens, Periods in one column, definition opens in place under the tapped row.
- Order: Life Path, Maturity, Internal State (Essence Cycle), Circumstances, Pinnacle and Challenge, Periods, Expression, Soul Urge, Personality, Balance, Birthday, Attitude, Karmic Lessons, Karmic Debt.
- Frame: the front page's angled cut corners, thick shaded silver rim, white inside, straight lines only inside (no wavy lines, no pink tint). Colour is a stand-in (garnet or emerald, owner does not mind).
- Dead: pastel cards, black panels, full-colour pages, grey, wavy lines inside the chart, a wavy frame around a straight one.

## Pictures
- `Craft-closed.png`, `Craft-open.png`: chart C, angled frame, closed and with Life Path open (garnet band).
- `Silver-closed.png`: same with a silver bevelled frame (transparent background).
- `real-numerology-expanded-silver.png`: the real expanded card restyled (from `scripts/real-expanded-restyle.js`).
- `Results-A14-fullscreen.png`, `wine_res_big4.png`, `Results-inside.png`: the approved fan results page with angled silver cards, larger cards, black card insides.

## Scripts
Playwright scripts that rebuilt each picture (`build*.js`), `defs.json` (the site's Life Path 22 wording), `num.json` (numbers for the full name), and the handoff harness patched to run here.
