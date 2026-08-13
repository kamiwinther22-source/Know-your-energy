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
- **In astrology/numerology/HD content specifically: no dramatic-sounding
  writing performing depth it doesn't have.** Phrases like "releasing what
  you've carried too long" are this genre's version of the same problem —
  language dressed up to sound profound instead of stating the real
  mechanism plainly. State the actual structural fact (e.g. "this is where
  the arc that began at [X] completes") as succinctly as possible; let the
  accuracy be what's striking, not the prose style. If a phrase sounds like
  it's trying to sound deep, it's doing the opposite of its job.
- **Don't deny a claim nobody made.** "Not because anything was overdue"
  only existed to correct an earlier draft's mistake — a fresh reader
  never assumed "overdue" in the first place, so denying it just imports
  the idea it's trying to avoid. State the fact; don't argue with a
  strawman left over from the editing process.

## Content audit checklist — ASTRO_DEFS / NUM_DEFS / HD_DEFS / GATES

**She has not approved any of this content.** Every single entry actually
reviewed so far (Sun/Scorpio, 7 "runs deep" instances, the 9 Pinnacle,
rewritten three times before it held) needed a real correction — treat
that as the expected outcome for the rest of it, not the exception. This
is heading toward a full rewrite of ~200+ entries (12 signs × 10 planets,
~120 planet-in-house combos, numerology's core/Pinnacle/Challenge numbers,
all 64 Gates, HD types/authorities/profiles), not spot fixes.

**Process:** work one category at a time (Sun signs first, since that's
the most-read single category). Do the research and redraft yourself,
batch it, bring her a compact before/after for the whole category in one
pass — not a conversation per entry. She skims and approves, or flags
specific ones for real discussion. Track category-by-category status
somewhere durable so it isn't dependent on memory across sessions.

**Checklist every entry must pass:**
1. Names the real, verified mechanism for this specific placement —
   checked against actual source material, not just internally
   plausible. (The Scorpio error: attributing a learning-style preference
   to Scorpio's core identity, when the real tradition is intensity and
   facing hard truths.)
2. No overused clichés or phrases that have stopped meaning anything
   through repetition (e.g. "runs deep").
3. Shows the full, real picture — doesn't lead with and end on the hard
   part alone, doesn't oversell positivity either.
4. Lesson/growth-edge framing must be earned in both directions: never
   invented where the placement doesn't actually have one (the original
   Scorpio error), but never suppressed or softened where it's real,
   either. "Lesson" is a genuine, specific part of some placements —
   Saturn, Chiron, the Nodes, numerology's Karmic Lessons and Karmic Debt
   Numbers (13/14/16/19) — and not a default to apply everywhere else.
   The priority is completeness: anything that may genuinely affect how
   someone experiences their life belongs in the entry, whether or not it
   happens to carry a "lesson" framing.
5. Direct, economical wording — not padded, not hedging, not sideways.
6. Observational, not advice-giving: describes what a period *is* or
   *supports*, never what happens *if you act a certain way inside it*.
   If it's genuinely observational it needs no "this isn't advice"
   disclaimer — the wording itself should make that obvious.
7. Doesn't universalize a specific narrative onto everyone. State only
   what's structurally/mechanically true for the whole cycle, not an
   assumed emotional experience (excess, struggle, overdue-ness).
8. No dramatic-sounding writing performing depth it doesn't have — state
   the structural fact plainly; the accuracy should be what's striking,
   not the prose style.
9. Doesn't argue with a strawman left over from a previous draft.
10. No dressing up plain things with fancier names.

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
  the eye back up. There should be a natural downward flow. **Precise,
  testable version of this rule:** the main point (the actual offer/CTA,
  not just a headline) must sit at or above vertical center of the page —
  never lower. This is a physical reaction for her, not a stylistic
  preference — eyes traveling down then back up registers as genuinely
  upsetting, not just suboptimal. Measure it (element's vertical position
  vs. page height / 2), don't eyeball it.
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
gone through many rejected redesigns. **These constraints exist to stop
specific incompetent patterns that were actually tried and failed — they
are guardrails, not a sacred final spec.** The page is genuinely open to a
better redesign; what's not open is reintroducing something already proven
not to work, or deviating from what's below *arbitrarily* (a change made
for no real reason reads as sloppy, not as a redesign — the bar is
"genuinely better and coherent," not "different"):

- **No grey and no gold anywhere on the results page** — both were tried
  (a brushed-metal grey card look, then a gold-accent replacement) and both
  were explicitly rejected ("gold is not the answer... in the never again
  pile"). Cards were transparent with a thin navy hairline border, solid
  navy buttons — note navy itself is now fully rejected sitewide (see
  Design-process rules above), so this specific color needs updating to
  whatever the current real accent is; the "transparent card, hairline
  border, no fill" *structure* is what was actually being protected, not
  the navy value itself.
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
  were each judged insufficient. **This one is also not sacred** — if
  there's a genuinely better way to present the results, it's allowed to
  break uniformity. What's not allowed is breaking it arbitrarily (e.g.
  making one box a different fill color with no real justification) — that
  reads as incompetent inconsistency, which is the actual thing this rule
  was protecting against, not uniformity for its own sake.
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

## Correction — there is only one audience for this page, not two

An earlier version of this file claimed the entry/data-form page (title,
birth-data fields, the "your unique design described by 3 separate
systems" preview) was for people who *already intentionally* came looking
for the app, and that a *separate*, still-unbuilt cold-open page was
needed to catch people with zero context. **She corrected this directly
and this was wrong:** "the entry page isn't for people who came looking
for this — I've been clear all along that this is for people who don't
even know anything about astrology numerology or human design. The
entire purpose is to catch attention, have them become interested enough
to go ahead and want to learn more about it. That is the goal." The
entry/data-form page itself IS the cold-open, scroll-stopping page — it
has to work for someone with zero context, not just for someone who
already searched for this. There is no second, separate landing page to
build later; this is the one page that has to do that job. Do not
resurrect the "two pages, entry form is done" framing.

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

- **A fix committed on a feature branch does not reach the live site until
  it's actually merged to `main`.** A "revert the swinging-planets/sparkle-
  title animation" commit was made and reported as done in an earlier
  session, but only existed on a `claude/*` feature branch — `main` (and
  therefore the live GitHub Pages site) still had the original
  animation-adding commit with no revert, so the bug was still live weeks
  later even though this file said it was fixed. Before telling her
  something on the live site is fixed, verify the fix commit is actually
  an ancestor of `origin/main` (`git merge-base --is-ancestor <sha>
  origin/main`), not just committed somewhere.
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
  ungrounded language is in progress, not complete. Category-by-category
  status:
  - **`ASTRO_DEFS.sun` (12 signs): audited, complete.** All 12 checked
    against the 10-point checklist and real astrological-consensus
    research (mechanism, strength, shadow, growth edge per sign, cross-
    checked against cafeastrology/numerologist.com/Wikipedia/shadow-
    astrology sources). Scorpio and Capricorn needed real rewrites
    (Scorpio: fixed a wrong learning-mechanism attribution; Capricorn:
    shadow/lesson were too narrow — "delay joy"/"rest" — now names the
    real Saturn mechanism, walling off vulnerability, and the fuller
    lesson of learning to receive help/love, not just rest). The other
    10 (Aries, Taurus, Gemini, Cancer, Leo, Virgo, Libra, Sagittarius,
    Aquarius, Pisces) were checked against verified sources and already
    passed the checklist — no changes made to those.
  - **`ASTRO_DEFS.moon`, `.mercury`, `.venus`, `.mars` (48 entries):
    audited, complete.** Checked sign-by-sign against the 10-point
    checklist and real sources (cafeastrology, numerologist.com,
    astrology.com, shadow-astrology writeups), including verifying
    dignity/rulership claims ("fully at home" lines) against actual
    domicile/exaltation/detriment/fall status, not just phrasing. One
    real fix: Moon/Scorpio's closing line ("risking vulnerability before
    you have absolute proof it's safe") repeated the exact framing
    already rejected for Sun/Scorpio — telling the reader to trust
    faster, when the settled rule is that Scorpio's guardedness is
    reliable, not a flaw. Reworded to name the real risk (suspicion
    outrunning evidence) without prescribing more trust. All 47 other
    entries (all 12 Mercury, all 12 Venus, all 12 Mars, 11 of 12 Moon)
    passed as-is — no changes made. Two Mercury entries got advisory
    (non-error) notes from the audit — Cancer's shadow is narrower than
    the fullest sourced picture but not wrong, and Scorpio's "hidden
    motives" shadow was checked against the same trust-framing concern
    as Moon/Scorpio and confirmed to be a different, legitimate
    mechanism (withholding one's own half-formed thinking, not
    prescribing trust in other people) — left unchanged.
  - **`ASTRO_DEFS.jupiter`, `.saturn` (24 entries): audited, complete.**
    Checked against sourced dignity status (domicile/exaltation/fall) and
    real Jupiter/Saturn tradition. All 24 passed as-is — no changes made.
    Saturn/Scorpio's closing line ("guard yourself so tightly nothing
    gets through") was specifically re-checked against the settled
    Scorpio-guardedness precedent and confirmed to be a genuinely
    different, sourced Saturn-specific shadow (over-armoring even with
    people already trusted) rather than a repeat of the rejected
    "trust people faster" framing — left unchanged.
  - **`ASTRO_DEFS.housecombo` (120 planet-in-house entries): audited,
    complete.** One real fix: `moon_12` claimed "this placement is fully
    at home," but the Moon has no domicile/joy claim to the 12th house
    (that belongs to Neptune/Pisces) — the false "at home" framing was
    borrowed from the two entries that legitimately have it (moon_4,
    mercury_3) and has been removed. The other 119 entries passed as-is.
  - **`ASTRO_DEFS.ascendant` (12 signs): audited, complete.** Ascendant/
    Scorpio had the same rejected "let a first impression include a
    little vulnerability, not just control" framing as the Sun/Moon
    fixes — corrected the same way (the guard is doing its job; what
    changes is who eventually earns past it, not how much a stranger
    gets shown). The other 11 signs were checked against real Rising-
    sign sources and the checklist. Cancer's growth-edge line ("showing
    warmth earlier... instead of waiting to be proven safe") was
    specifically re-checked against the Scorpio precedent since the
    wording pattern is similar, and confirmed to be a different,
    legitimate mechanism — Cancer's shell is about self-protection from
    vulnerability, not judgment of others' trustworthiness the way
    Scorpio's guardedness is, and real Cancer tradition does treat
    learning to be seen as a genuine growth theme. Left unchanged. The
    other 10 signs passed as-is, no changes made.
  - **`ASTRO_DEFS.midheaven` (12 signs): audited, complete.** One fix:
    Midheaven/Scorpio had the same rejected "let your reputation include
    more transparency" framing as the other Scorpio fixes — the privacy
    is a real asset in discretion-based work, not a flaw to soften.
    Reworded to say that directly instead of ending on a growth edge.
    Also confirmed Capricorn's "fully at home" claim is legitimate here
    (natural zodiac-wheel correspondence, Capricorn↔10th house/MC — a
    real, sourced convention distinct from planetary domicile, not a
    category error carried over from planet entries). Other 10 signs
    passed as-is.
  - **`NUM_DEFS.personalyear`, `.personalmonth`, `.personalday`,
    `.essence` (49 entries): checklist-compliance pass done, not yet a
    full sourced-accuracy audit.** These are the only NUM_DEFS categories
    describing an actual real-time period, so they're the ones the
    "observational, not advice-giving" checklist rule (item 6) actually
    binds — unlike the permanent-trait categories (Life Path, Expression,
    etc.), which use the same established growth-edge phrasing as the
    already-audited Sun signs and aren't subject to this rule. Found and
    fixed roughly 20 entries across these four categories that gave
    literal second-person commands ("Make the ask, send the invoice,
    close the loop," "Push hard," "Cancel what you can," "Say the thing
    you've been sitting on," etc.) instead of describing what the period
    supports — reworded all of them to observational phrasing. Still
    needs a real sourced-accuracy pass like Sun/Moon/etc. got; this pass
    only fixed the advice-giving violation.
  - **`ASTRO_DEFS` outer planets (Uranus/Neptune/Pluto, 36 entries):
    audited, complete.** Real transit-date claims fact-checked against
    ephemeris data, not just the interpretive content. One genuine
    factual error found and fixed: Neptune's Aquarius and Pisces date
    ranges were swapped (had Neptune moving backward through the zodiac,
    which isn't physically possible) — corrected to Aquarius 1998–2012,
    Pisces 2011–2026 (the interpretive text for each was already
    correctly matched to the right sign, only the years were wrong). Two
    minor date-precision fixes: Neptune/Aries's "the 1860s" widened to
    "the 1860s–70s" (real prior transit ran 1861–1875), Pluto/Gemini's
    start year corrected 1883→1882. Two style fixes: Uranus/Scorpio's
    "force you to release something you were holding onto too tightly"
    was the exact "carried too long" cliché pattern already banned
    elsewhere in this file — replaced with a plain statement of the
    mechanism; Pluto/Scorpio's "once you stop resisting it" was
    prescriptive/advice-giving — replaced with an observational phrase.
    The other 30 of 36 entries passed as-is.
  - **`NUM_DEFS` core/cycle categories (lifepath, expression, soulurge,
    personality, birthday, attitude, balance, maturity, pinnacle,
    challenge, karmiclessons, karmicdebt — ~185 entries): audited,
    passing.** Checked via direct research (not subagents, to avoid
    burning session capacity) against real sources — Life Path 8's
    "more wealth potential than any other Life Path" claim, the "0
    amplifies rather than adds a separate influence" convention behind
    Birthday 10/20/30, Challenge 7's trust theme (confirmed genuinely
    different from the Scorpio-guardedness precedent, not a repeat of
    it — Challenge 7 is real numerology tradition about developing
    trust generally, not about judging who's safe), and all four
    Karmic Debt meanings (13/14/16/19) — all confirmed accurate. Also
    confirmed Attitude and Balance are real, standard numerology
    concepts (first-impression number and stress-coping number,
    respectively), not invented categories. Real fix already applied:
    Personal Year 8 was missing its shadow side and framed the whole
    year as just money/career (real tradition: it's a harvest year
    about reaping what's been sown, with rigidity/ruthlessness as the
    actual shadow) — see the personalyear/month/day/essence entry
    above for that fix and the separate advice-giving cleanup.
  - `HD_DEFS` and `GATES` (64 gates): not yet audited. Note: `GATES`
    content, on inspection, already looks substantive and well-
    constructed (consistent gift/shadow mechanism pattern per gate) —
    still needs a real sourced pass before calling it audited, not
    assumed fine because it reads well.
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
