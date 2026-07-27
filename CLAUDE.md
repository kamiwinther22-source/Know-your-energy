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
