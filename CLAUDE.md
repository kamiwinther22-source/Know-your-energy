# Know Your Energy — standing rules

This file is read automatically by every Claude Code session that works in
this repo. It exists so hard-won design decisions and repeated frustrations
don't have to be re-explained from scratch in a new chat. If you are an
instance of Claude reading this: these are not suggestions, they are settled.

## Design-process rules (not just visual rules)

- **Never default to the statistically common/safe choice and call it a
  design decision.** Blue+gold, then burnt-orange/terracotta, both got
  reached for repeatedly because they're overrepresented in mainstream
  2020s web/template design, not because they were actually chosen for
  this site. If a color or pattern is the "safe" one, that's a reason to
  reject it, not use it — she wants to stand out, not blend into what
  every other AI-assisted site already looks like. Actively check: would
  this read as generic/predictable to someone who's seen a lot of sites?
- **No dressing up plain things with fancier names.** "Ink and bone"
  instead of "black text on white background," "terracotta" instead of
  "orange" — renaming a plain material doesn't change what's actually on
  the screen, and she reads it as spin. Say what it plainly is.

## Codebase structure & tech stack

Small, no-framework, no-build-step app: a single static HTML file plus a
single Cloudflare Worker file. No test suite, no linter, no bundler, no
`node_modules` checked in.

| File | Role |
|---|---|
| `index.html` (~2,300 lines) | The entire front end — markup, CSS, and vanilla JS all in one file. No React/Vue/build tooling. Contains the entry/data-form page (title, pricing, birth-data fields, results grid, tap-to-expand modal) described below. Key in-file data objects: `ASTRO_DEFS`, `NUM_DEFS`, `HD_DEFS`, `GATES`, `CHANNELS` (glossary/definition content), and the `ar()` function (astrology placement list renderer). Deployed via **GitHub Pages**, not the Worker. |
| `worker.js` (~890 lines) | Cloudflare Worker — the entire backend API. Single `export default { fetch(request, env, ctx) {...} }` handler with hand-rolled `if (url.pathname === ...)` routing (no router library). Deployed via `wrangler deploy`, triggered by the `Deploy Worker` GitHub Action. |
| `astro-engine.js` | Local astrology calculation (`computeAstrology`) — wraps `circular-natal-horoscope-js` (Moshier ephemeris). No external API, no rate limit. Imported by `worker.js`. |
| `numerology-calculator.js` | Pure pythagorean-numerology calculations (`calculateFullChart` and its per-number helpers: life path, expression, soul urge, pinnacles, challenges, etc). Imported by `worker.js`. |
| `cities.js` | Birth-city → lat/lng lookup (`findCity`). Two layers: the generated `cities-data.js` dataset, then a small built-in `MAJOR_CITIES` list, then a New York fallback. |
| `cities-data.js` | **Generated file — do not hand-edit.** ~31,000 world cities from GeoNames. Starts empty in the repo; populated by `build-cities.mjs` during the deploy workflow. |
| `build-cities.mjs` | Node script that downloads GeoNames' `cities15000.zip`, unzips it (hand-rolled zip parsing, no dependency), and writes `cities-data.js`. Runs automatically in CI before every Worker deploy; safe to fail (deploy continues with the built-in city list if the download hiccups). |
| `wrangler.toml` | Worker config: name `know-your-energy`, entry `worker.js`, one KV binding (`PASSES`, used for pass records and the running usage/cost counter). |
| `package.json` | One real dependency: `circular-natal-horoscope-js`. `"type": "module"` — everything is ES modules. |
| `CNAME` | GitHub Pages custom domain: `know-your-energy.com`. |

### Worker API surface (`worker.js`)

All routes live in the single `fetch` handler, gated by `CORS_HEADERS` (open,
`Access-Control-Allow-Origin: *`) and `PRIVACY_HEADERS` (no-store/no-cache).

- `GET /robots.txt` — disallow-all; this `*.workers.dev` host is API-only,
  the real site is `know-your-energy.com`.
- `GET /astro-check` — self-test: runs a sample chart through the local
  astrology engine, returns JSON. Useful to confirm the engine is alive
  after a deploy.
- `GET /usage` — no-auth running cost dashboard (HTML page) reading a
  lifetime token/cost counter out of the `PASSES` KV namespace. Not
  customer data, intentionally public.
- Everything else requires `POST`:
  - `/create-checkout-session` — creates a Stripe Checkout session for one
    of `PLAN_CONFIG` (`single` $5, `monthly` $10, `annual` $25 — all
    one-time `payment` mode, never `subscription`).
  - `/record-pass` / `/check-pass` — verify a Stripe session and read/write
    a pass record in KV (`PASSES`), including the `UNLIMITED_EMAILS`
    bypass for the three family addresses.
  - `/report` — the main endpoint: takes person(s) astrology + numerology +
    Human Design data, calls the Claude API (`generateReport`,
    `model: 'claude-sonnet-5'`, `thinking: { type: 'disabled' }`), returns
    the generated reading JSON.

### Required secrets / env (not in the repo)

Set via `wrangler secret put <NAME>` (or the GitHub Actions secrets used by
`Deploy Worker`): `ANTHROPIC_API_KEY`, `STRIPE_SECRET_KEY`, `HumanDesign_key`,
plus `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` for the deploy action
itself. The `PASSES` KV namespace binding lives in `wrangler.toml`.

## Development workflow

- **No local dev server / build step is set up for the frontend.** `index.html`
  is opened directly or previewed as a static file; there's no bundler to run.
- **There is no test suite and no linter in this repo.** Verify changes by
  reading the diff carefully, and for anything visual, by taking real
  screenshots (see the Playwright/measurement rule below) — don't invent a
  test framework that doesn't exist here.
- **Deploys are two independent pipelines, triggered by different things:**
  - `worker.js` (the API) is redeployed by the `Deploy Worker` GitHub Action
    (`.github/workflows/deploy.yml`), which runs on every push to `main`:
    `npm install` → `node build-cities.mjs` → `wrangler deploy worker.js`.
  - `index.html` (the static site) is redeployed by **GitHub Pages**, a
    separate, automatic "pages build and deployment" check that also fires
    on every push to `main` — not part of `.github/workflows/`. See the
    gotcha below on how to actually confirm this ran.
  - Pushing to `main` therefore redeploys both halves of the app at once;
    there's no way to deploy just one from a normal push.
- Work happens on feature branches (e.g. `claude/*`) and lands on `main`
  via PR; `main` is what's live.

## Non-negotiable design rules

- **The "Know Your Energy" title is always one line, in large loopy cursive
  (Alex Brush).** Never split across lines, never a different font, never
  omitted from a landing/entry page. This is a staple; versions without it
  are an instant rejection.
- **No dark/night-sky/cosmic/celestial theme, anywhere.** The navy + gold +
  silver palette was chosen for a *classy, premium* feeling — explicitly NOT
  a space/stars/constellation/night-sky mood. This has been misread multiple
  times (starfields, nebula shaders, orrery animations) and rejected
  forcefully every time.
- **Never fade text or reduce opacity for a "muted" look.** Text is always
  full-strength and legible. She has said this many times, forcefully.
- **A title's text color and its outline/frame color must never be the same
  tone.**
- **Never write her copy.** Build visuals and layout only; leave clearly
  marked placeholder text. Her wording will always be better than anything
  generated, and seeing generated copy actively distracts her from writing
  her own.
- **Don't put the main point at the bottom of a page** in a way that forces
  the eye back up. There should be a natural downward flow.
- **If she shares a real reference image, actually use it** — don't
  substitute a generic/invented version, and don't crop it down to something
  smaller/safer than what she asked for.
- **Prefer real, verified techniques over fabricated ones.** Research things
  for real (WebSearch, actual docs) and verify designs by actual measurement
  (Playwright screenshots, pixel sampling, bounding-box checks) — never
  eyeball whether something fits, renders correctly, or matches a validated
  palette.
- **Fewer, more complete design passes beat many small tweaks.** The longer
  she has to keep adjusting something, the more likely she ends up disliking
  it entirely and wanting to toss it. Get a design substantially right in one
  or two passes rather than iterating live many times.
- **Never use a multiple-choice/button-click question widget with her.** If
  something genuinely needs clarifying, just ask in plain text.
- **Never invent a test/demo name.** When synthetic people are needed for
  testing or mockups, use "Person One" / "Person Two" — or ask her. Do not
  make up a realistic-sounding name for her, anyone in her family, or a
  fictional test subject.

## Results page — settled, don't relitigate

The results page (astrology/numerology/HD cards + Reading, per person) has
gone through many rejected redesigns. These are settled, not open questions:

- **No grey and no gold anywhere on the results page** — both were tried
  (a brushed-metal grey card look, then a gold-accent replacement) and both
  were explicitly rejected ("gold is not the answer... in the never again
  pile"). Cards are transparent (no fill, page texture shows through) with a
  thin navy hairline border; buttons are solid navy.
- **No decorative connecting lines/glow paths between cards.** An "energy
  convergence" treatment (soft SVG light-paths flowing from each chart into
  the Reading) was built and explicitly rejected as unattractive/gimmicky/
  "obvious." Don't reintroduce connector-line motifs.
- **If a circular/mandala layout is ever attempted again, the circles must
  be precisely symmetric** (true circles, equal radius) — an organic
  blob/border-radius version was rejected as "bloblike."
- **All 7 result boxes are literally identical, fixed size** — each
  person's Astrology/Numerology/Human Design (6 total) plus the one shared
  Reading panel. Not just similar widths — same fixed height too. This was
  a direct, repeated instruction after equal-column and equal-width passes
  were each judged insufficient.
- **Each card shows a capped preview** of its content in the small grid
  view (`max-height`/`flex:1`, hard-clipped — no bottom fade-out
  gradient); full content only appears in the existing tap-to-expand
  modal. Don't dump full chart content into the small card. An earlier
  version of this used a gradient fade on the clipped edge; she rejected
  that directly as exactly the kind of opacity-based fading the
  never-fade-text rule forbids — the clip must be a clean hard edge, full
  strength text right up to the cut.
- **Nav buttons should look pressable and inviting, not blend into the
  page.** A white-on-white stretched pill was rejected as boring/blending
  in; a spinning conic-gradient ring with sparkle glints was rejected as
  "game show"/circus. Current settled look: solid navy pill, sized to its
  own content (not stretched full-width), small icon, real lift shadow. She
  does want genuine sparkle/glitter eventually, but **only** if it can be
  built to match specific glitter reference images she shared earlier in
  conversation — never invent a sparkle effect from scratch.

## Two distinct front-end pages — do not conflate them

- **The entry/data form** (navy background, gold cursive title, pricing list,
  birth-data fields) is for people who *already intentionally* came looking
  for this app (e.g. an app-store listing). It works today and does not need
  a redesign for that use case.
- **A cold-open, scroll-stopping landing page** for people with zero context
  who know nothing about astrology/numerology/Human Design and need to be
  visually stopped mid-scroll before they'd ever read a tagline — this is a
  genuinely separate, still-unsolved page. Past attempts got folded back
  into the entry form and never shipped as their own thing. Don't assume
  work on one of these pages says anything about the other.

## Real repo facts worth not re-discovering

- Astrology is computed **locally** (`astro-engine.js`) — no paid external
  API, no rate limit. `worker.js` strips house/Ascendant/Midheaven data when
  birth time is unknown rather than guessing from a defaulted time.
- Stripe Checkout is wired for one-time charges only (single/month/year
  passes) — never a subscription/auto-billing.
- Three family emails have unlimited free access (see `UNLIMITED_EMAILS` in
  `worker.js`) — don't remove this without being asked.
- Real Claude report generation is wired into `/report` in `worker.js`
  (`model: 'claude-sonnet-5'`, thinking explicitly disabled — enabling it
  previously caused truncation).
- The results page already has a tap-to-expand pattern (`.card-expand` /
  `#cardExpandBody` in `index.html`) used by every result card. Reuse this
  rather than building a new expand mechanism.
- The astrology card's placement list (Ascendant, Midheaven, each planet's
  sign + house) already exists and works — it's the `ar()` function in
  `index.html`. There is no "aspects" (trines/squares) list anywhere in the
  code; if that's ever wanted it would be new work.
- Numerology and astrology tap-to-reveal definition glossaries already exist
  and are real, substantive content (`NUM_DEFS`, `ASTRO_DEFS` in
  `index.html`) — not placeholders.

## Technical gotchas already paid for once

- Any asset (image, font) referenced by a **relative path** breaks when a
  file is sent as a standalone chat attachment — there's no shared
  filesystem between separately-sent files. Base64-embed as a data URI
  instead, and verify it actually loaded (`img.complete && img.naturalWidth`,
  `document.fonts.ready`) before resending.
- Android auto-boosts text size by default, which can break box-sizing
  assumptions — set `text-size-adjust: 100%`.
- Prefer static/hardcoded CSS sizing over JS-computed/auto-sizing — dynamic
  sizing has repeatedly broken on her real device in ways sandbox testing
  didn't catch.
- `tsParticles`'s "full bundle" requires OffscreenCanvas + a Worker with no
  fallback — it can silently render nothing. Hand-rolled Canvas 2D is more
  reliable for simple particle effects.
- `pointer-events:none` makes an element invisible to `elementFromPoint` /
  hit-testing even when visually on top — verify visuals with real
  screenshots/pixel sampling, not hit-testing tricks.
- Zodiac/planet Unicode glyphs (♈ ☉ etc.) can render as fixed-color emoji on
  some systems, silently ignoring any `fill`/`color` set on them — verify by
  sampling actual rendered pixels, not just checking the DOM attribute.
- SVG arc commands need the correct sweep-flag or the arc bows the wrong way
  (concave instead of convex) even though both endpoints are mathematically
  correct — verify with `getPointAtLength`, not by eye.
- **CSS Grid auto-placement will silently scatter items across "holes."**
  If one item has an explicit `grid-column` but no explicit `grid-row`
  (e.g. a shared Reading panel below a taller row), the empty cells beside
  it get backfilled by whatever comes next in DOM order, not left blank.
  Give every grid item an explicit `grid-row` if the layout has any row of
  uneven-height content next to a partially-placed item — don't rely on
  auto-flow.
- **The "Deploy Worker" GitHub Action only redeploys `worker.js`** (the API
  backend: `/report`, `/create-checkout-session`, etc). It does **not**
  deploy `index.html`. **`index.html` is deployed by GitHub Pages**, not
  Cloudflare Pages — confirmed via the repo's `CNAME` file
  (`know-your-energy.com`) and a separate "pages build and deployment"
  check that runs automatically on every push to `main` (visible via
  `mcp__github__actions_list` with `method: list_workflow_runs`, filtered
  to `main` — look for runs named "pages build and deployment", not
  "Deploy Worker"). A green run there, on the current commit, **is** real
  evidence the static site redeployed — check that instead of assuming
  nothing can be confirmed. Browser/CDN caching can still delay what she
  actually sees, so a hard refresh or private tab is worth trying before
  concluding a successful deploy didn't take.
- **This sandbox's network policy blocks fetching the live domain
  directly** — arbitrary outbound requests to know-your-energy.com get a
  403 from the proxy. There is no way to independently verify the live
  site from inside a session; don't claim to have checked it — ask her to
  look and describe/screenshot instead.
- **The local sandbox's git working directory has repeatedly, silently
  reverted to a stale old commit mid-session**, even when `origin` has
  later commits. Always run `git fetch origin <branch>` and compare
  `git log -1` against `origin/<branch>` before trusting a file read or
  making an edit — don't assume the working tree is current.

## Open threads not yet resolved

- A full audit of `ASTRO_DEFS`/`NUM_DEFS`/`HD_DEFS`/`GATES` for vague,
  ungrounded language is in progress, not complete. NUM_DEFS and the 7
  personal-planet ASTRO_DEFS signs have had at least one real pass; the
  64 Gates and the outer-planet (Uranus/Neptune/Pluto) entries have not.
- **Settled, not open — do not relitigate:** the precise, final rule on
  Sun/Scorpio's trust theme, stated directly by her after real research
  surfaced a genuine tension: the guardedness/slow-to-trust mechanism
  IS real and accurate (it matches actual multi-source astrological
  consensus — Scorpio keeps people at a distance until they've proven
  they belong closer). What's wrong, and was wrong in every earlier
  attempt at this entry, is framing that guardedness as a flaw or a
  lesson to grow out of — implying Scorpio "should" trust more or let
  their guard down. That's false: the judgment behind the guardedness
  is reliable, not a mistake. Her words: "any statement that includes
  judgement such as needing to let guard down more is probably going to
  rub wrong bc I have never regretted choosing not to trust someone and
  I am rarely wrong about who i do trust." The current entry (as of
  commit `9eb35c2`) states the mechanism and its reliability directly,
  and deliberately has no prescriptive "growth edge" — it's the one Sun
  sign entry that doesn't end on a named lesson, and that's intentional,
  not an inconsistency to "fix." **Before editing any existing
  ASTRO_DEFS/NUM_DEFS/HD_DEFS entry, check `git log -p -- index.html`
  (or `git blame`) for that specific line first** — a past correction to
  content you're about to "fix" may already have happened and just not
  be reflected in this file's own notes. This file describing something
  as "open" is not proof it still is; verify against the actual commit
  history, which is the real record.
- The Human Design BodyGraph is now built (real SVG, 9 centers, real
  channel data, defined/undefined per person) — no longer blocked.
