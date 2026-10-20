# DESIGN CONCEPTS — read this first

**These are design explorations, not the site. Do not merge this branch into `main`.**
They contain the owner's own birth details (11/14/1977, 6:46 pm, Sioux City, Iowa) as sample data, and the
pages are unfinished and use placeholder wording and colours. Anything on `main` is published at know-your-energy.com.

Every `.html` here opens straight in a browser; the matching `.png` is how it looked rendered at phone width
(390 px). Open the `.png` files first if you just want to see the ideas.

## Where the project stands (as of 2026-10-20)

Decided with the owner:
- The **timing page is its own page**, reached after the normal data entry. Individual reading first; relational later.
- It shows **no birth-chart placements** — only where the planets are now and what that means for the person.
- Numerology stays together: **month ring of 12 with the day ring of 9 inside it**, plus the **vertical timeline**
  (Year and Essence, Pinnacle, Challenge, Period, and the astrology returns). Essence always sits with the Year.
- The daily reading is **conversational, with no placements named**, and says where numerology, astrology and Human
  Design **agree and where they pull apart**, and what that means. Shorter cycles sit inside longer ones
  (e.g. a 1 day inside a 9 month = one beginning that moves a finishing forward). That combining rule is the
  designer's own reasoning, not from a published source — check it against World Numerology when it can be read.
- The first free reading stays **complete**. Cost per reading is about $0.13 (the Worker's `/usage` page).
- Cycle wording must be written **after reading World Numerology and a second named site (Cafe Astrology)**.
  Those hosts are blocked by the cloud environment's network policy until the owner adds them under
  Network access > Custom > Allowed domains.
- The astrocartography **globe** (drag to rotate, easy zoom, follow a line, cities appear as you zoom) is wanted as a
  results-page / pass feature, after the first page. Not built.
- Number colours are placeholders; the owner will assign them.

## Folders

| Folder | What it is |
| --- | --- |
| `timing-page/` | The main work. Newest and best: `k3.html` / `k3.png` (full page: numbers + sky today + descriptions). `k2` is the version before. `jm`/`j` vertical timeline; `i`/`i1p` left-to-right timeline; `f` two-person comparison; `g` three other page structures (date picker, swipe cards, countdown list); `d`,`e`,`h` earlier dials and grids. `gen*.mjs`, `today*.mjs` produce the real data (`dial.json`, `me.json`, `tr.json`, `today.json`). |
| `solar-system/` | The real solar system from above (NASA/JPL orbital elements, checked against the astrology engine to ~0.4°). |
| `astrocartography/` | Planet lines on a world map from the exact birth moment. `ac_page2.html` is the plain-language version. `ac.mjs` is the calculation (its Midheaven matches the astrology engine exactly). |
| `watch-faces/` | A watch-face idea for Year/Month/Day. Judged not useful for daily check-ins. |
| `light-front-page-test/` | A light-coloured version of the front page, tried and set aside. |
| `results-page-first-ideas/` | The first three results-page concepts (all red, rejected as too busy). |
| `earlier-mocks/` | Older mocks, including the original red front-page mock. |
| `test-helpers/` | The Playwright scripts used to test the front page (`lib.js` serves the repo files and stubs the Worker). |
| `draft-writing/` | The Personal Year description draft the owner chose not to review one by one. |

## Notes for whoever picks this up

- Fonts: the pages load Fraunces from `../fonts/node_modules/@fontsource/fraunces/files/`. To view them with the real
  font, run `npm i @fontsource/fraunces` in a `fonts/` folder next to this one; otherwise they fall back to Georgia.
- The `.mjs` generators need `circular-natal-horoscope-js` (and `world-atlas`, `topojson-client`, `d3-geo` for the maps):
  `npm i circular-natal-horoscope-js world-atlas topojson-client d3-geo`.
- The astrology engine is already in the site (`astro-engine.js`). Human Design gates come from the page's own
  `GATE_WHEEL_ORDER`, `CHANNELS` and `GATES` tables.
- Public-facing rules for the front page are in `CLAUDE.md` on `main`.
