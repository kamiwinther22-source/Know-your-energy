# Know Your Energy — standing rules

This file is read automatically by every Claude Code session that works in
this repo. It exists so hard-won design decisions and repeated frustrations
don't have to be re-explained from scratch in a new chat. If you are an
instance of Claude reading this: these are not suggestions, they are settled.

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
- **Each card shows a capped, fading preview** of its content in the small
  grid view (`max-height`/`flex:1` + a bottom fade-out gradient); full
  content only appears in the existing tap-to-expand modal. Don't dump full
  chart content into the small card.
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
  deploy `index.html`. The static page is served through some other
  mechanism not visible in this repo's CI (most likely Cloudflare Pages
  watching the repo directly) — a green "Deploy Worker" run is *not* proof
  that an HTML/CSS/JS change is live. The only reliable confirmation is her
  checking her own phone/browser.
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

- A full audit of `ASTRO_DEFS`/`NUM_DEFS` (in `index.html`) for vague,
  ungrounded metaphor language (e.g. "your personality runs deep rather
  than wide") was explicitly requested and is queued but not started.
- The Sun/Scorpio definition currently frames Scorpio's trust-instinct as
  accurate and doesn't mention guardedness/slowness-to-trust, which is
  independently well-documented in real sources as a separate, real trait.
  She was asked whether to add it back as its own honest point — no answer
  yet.
- The Human Design BodyGraph circular/mandala chart is still blocked on
  needing the real 64-gate wheel ordering (channel/defined-center data is
  already available via the API and not the blocker).
