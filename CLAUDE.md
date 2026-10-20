# Know Your Energy: working notes

## How to work with the owner (this comes first)
- **What the owner says in the current message is the instruction.** It overrides anything written in this file, in earlier chats, in commit messages or in code comments. If they change their mind, follow the new words. Never quote an old rule back at them as a reason to push back.
- Do exactly what they say. Don't add, don't subtract, don't reinterpret. If a request could mean two things, ask one short question before spending effort.
- Design is reviewed as **pictures at phone width (about 390 px), whole pages, not strips**. For design work, show a picture and wait for approval before changing the site or writing real wording.
- Say plainly what is done and what isn't. Don't oversell.
- Their usage is limited. Don't tweak or redo something they rejected, and don't build ahead of a decision.
- When the owner specifically asks for a change, merge it to `main` (that publishes the site). Don't merge anything they didn't ask for. Experiments go on a separate branch.
- **There are no standing look rules.** The look of the front page and of the results page is undecided and is whatever the owner says now. Metallic styling is not wanted.

## What the site is
- Static front end on GitHub Pages (`index.html`, `red-look.css`, `CNAME` = know-your-energy.com) plus a Cloudflare Worker (`worker.js`, KV namespace `PASSES`). A merge to `main` deploys both (`.github/workflows/deploy.yml`, which also builds the city list from GeoNames).
- Charts: numerology (`numerology-calculator.js`), astrology (`astro-engine.js` with `circular-natal-horoscope-js`, city lookup in `cities.js`), Human Design (a paid API called from the Worker). The written reading comes from the Claude API; cost is about $0.13 per reading (see the Worker's `/usage` page).
- Promises to visitors: birth details and readings are not kept on the server, no emails are sent to them, and an email address is their pass (unverified).
- `PAYMENTS_ENABLED` is `false` (no payment processor yet). Three family emails are unlimited.
- Testing is done with Playwright in Chromium against stubbed Worker calls. It cannot test real iPad/Safari, the Cloudflare dashboard, payments or real reports.

## Where things stand
- Design explorations for the timing page, solar system, astrocartography globe and results page are on the branch `design-concepts` (read `design-concepts/README.md` there). That branch contains the owner's birth details and must not be merged into `main`.
- Open: the timing page structure; the cycle wording (needs World Numerology and a second named site to be read first; blocked until `worldnumerology.com`, `www.worldnumerology.com` and `cafeastrology.com` are allowed in the cloud environment's network settings); free-reading limits, email checks and device limits (decided, not built); payment processor; astrocartography globe.
