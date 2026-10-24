# Handoff for a new thread

Read `/FEEDBACK-LOG.md` first (every owner reaction, with DEAD lists) and `/CLAUDE.md`. Both are in the repo root. Then use this folder.

## What is here
- `results-page/` the approved results page arrangement, built from real data (sample people Alex and Casey): a fan of three cards per person (Astrology, Numerology, Human Design), a small Reading card, one bare Globe with its one-sentence description, a Timeline card, "Run another reading". No Pass on the page. One phone screen (about 390 x 664).
  - `results_page_wine_look.png` in the look of the live front page (wine ground). NOT settled: the owner said they do not want the front page to look as it does.
  - `results_page_blue_look*.png` earlier sapphire version (also not settled; owner said "basic blue" is out).
- `charts/` every real chart card from the live site (Astrology wheel, Numerology list, Human Design bodygraph), for both people, plus the large wheel and bodygraph.
- `timeline/` the Timeline: all eleven columns equal width (Personal Year, Essence, Pinnacle, Challenge, Period, then Saturn, Jupiter, Uranus, Neptune, Pluto, North Node), every name vertical, number colours from the owner's saved picker, today as a plain dark line, pinch zoom with a typed date field, two-year zoom with month marks. Whole-life view is zoomed out.
- `globe-and-art/` the silver disc (first silver that looked like polished metal) and the globe asset.
- `source/` the scripts that built them (`harness.mjs` loads the real site with stubbed Worker calls; `W_4.mjs` builds the results page; `W_wine.mjs` the wine look), plus sample data.

## Owner's saved number colours (use exactly)
1 #ff9c1a, 2 #94b2ff, 3 #fefe8b, 4 #0b0b10 (near-black, never grey), 5 #41a476, 6 #ffa3ff, 7 #a345bf, 8 #935734, 9 #d10000. 11, 22, 33 take the colour of 2, 4, 6. The number colours are NOT the brand.

## Status of the look (be honest about it)
- The page look/colour is NOT decided. Rejected so far: night-sky dark ground, faded blue-grey, tan or cream, jewel tones, basic blue, plain primary/secondary brand colour, blooms, colour blocking, stripes, minimal, the wine ground with a black dial, the three flat discs in a row.
- Not rejected, unresolved: the live front page look is NOT accepted (owner: they do not want it to look as it does).
- Silver at the quality of the original solar-system picture is wanted; polished silver built from real geometry worked (see `globe-and-art/`).
- The front page layout is unresolved. Layouts still alive and unseen: diagonal split; a framed window. Dead: giant type, sideways scroll, three tall panels, centred dial over a form.

## Working rules from the owner
One thing per message. Never show work with known flaws. Build only what you believe is fundamentally better than what exists. Change exactly the part the owner comments on; silence is not approval. Never ask a question when you can show something. Never mention a feature as locked. Do not recreate the solar system.
