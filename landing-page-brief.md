# Landing page & site-flow design brief

Working reference for the cold-open landing page, the entry form it leads into,
and the results page — pulled together after a long back-and-forth so it
doesn't have to be re-derived from scratch. Treat this as current understanding,
not a locked spec — update it when something here turns out wrong.

## What the page actually has to do

- Stop a scroll-happy stranger who has zero context, before they'd ever read
  a tagline — the visual has to do work before any words are read.
- Communicate honestly that this is three independent systems combined, not
  "an astrology site" — leading with only zodiac imagery misrepresents it.
- The hook is not a headline fact ("three systems, zero overlap") — that's
  abstract and doesn't land. The real hook is something **checkable against
  the visitor's own memory**: their own beginnings, endings, and turning
  points already following a pattern they never noticed. That's a claim
  someone can go verify against their own life in ten seconds, which is a
  fundamentally stronger hook than asking them to trust an explanation.
- Underlying logic available to draw on, if useful: the data these systems
  run on (celestial positions, number cycles) is real and cyclical, the same
  category of thing that reliably produces seasons — not invented, just
  decoded. Nobody "sees" you; math someone else worked out well describes a
  pattern that already existed. Three independently-decoded vocabularies
  landing on the same read is real depth, but it's supporting weight, not
  the opening line.
- **Relational (two-person) value has been consistently missing or
  underweighted in every attempt so far and needs real presence** — not a
  footnote after the individual-reading pitch.
- "1 full reading, free, no card" must be structurally unmissable, not fine
  print — and worded accurately: no card *for the free reading*, not "no
  card ever" (a card is involved if someone chooses to buy more).
- No quiz-like sequential flow anywhere — one direct entry point.
- **The main point (the actual offer/CTA) must sit at or above vertical
  center of the page.** Hard, measured rule — see CLAUDE.md's "Non-negotiable
  design rules." This is a physical reaction for her, not a preference.
- No stock photography of people, anywhere.
- Has to avoid reading as a recognizable template shape — "colored hero
  panel + centered wordmark + wave divider + white CTA card" gets pattern-
  matched as generic regardless of how bold the colors are. Boldness in
  color doesn't rescue a predictable composition.

## Reference images — the actual verified technique, not a mood description

- **12 gold zodiac sculptures** (her own AI-generated set) and **pink/blue/
  gold swirl with sparkle** — the real, built-and-approved technique behind
  both (tested in isolation as a gray sphere, explicitly approved after one
  round of correction): **at least 3 separate hotspots per shape**, not one
  gradient. Each hotspot is a radial gradient with a tight near-white core
  (0–3% of its radius at ~95–100% white) softening through 2–3 intermediate
  opacity stops out to a 17–26% radius, then fully transparent — soft-edged,
  not a flat pasted circle (the first version was rejected specifically for
  having hard-edged discs). Layer 3–8 four-point star "glint" marks on top
  at varied sizes (7–22px) and opacities (0.7–1.0), scattered off the main
  hotspots, not centered on them. Gold itself is a rejected site color —
  this technique is the transferable part, not the hue.
  Full bespoke illustration in this exact sculptural style was set aside as
  too much execution risk for hand-coded CSS/SVG — this hotspot+glint
  technique is the CSS-buildable substitute, not the same thing.
- **Glass key + silver puzzle piece**: no built/verified technique yet —
  only established as a material/mood reference (cool, silver-white,
  premium). Don't treat this as more resolved than it is.
- **"Hypnotic Relief" glowing key in hands** (her own separate business —
  reference the technique only, never the asset or branding): also not yet
  built or verified — the observed technique is directional soft-edged
  light rays radiating outward from one bright source, distinct from the
  hotspot+glint technique above. Untested in this codebase so far.
  The black background in this reference is explicitly **not**
  transferable — no dark/cosmic theme, ever, full stop, regardless of what
  technique is drawn from the image.

## Color — history and the actual lesson

**Permanently rejected, do not revisit, no exceptions:**
- Navy, every gold/yellow-gold tried (flat, mustard, antique brass),
  wine/burgundy/plum, forest green + brick, black + magenta/cranberry,
  tan as a base (reads as monochrome with anything on top of it).
- **Red, in every form, including desaturated/muted versions.** A muted
  "mauve" (`#a4526d`) was shown as a supposedly-different, more
  sophisticated choice and was correctly called out as still just red with
  the saturation turned down. Wine, cranberry, coral, mauve, dusty rose,
  rust, brick — all of these are red family. None of them are back on the
  table by wearing a different name.
- **Orange, in every form**, including "coral" (coral is a verified
  red-orange blend, see the Pantone Living Coral research earlier — it's
  not a loophole around the red/orange ban).
- **Blue only as the one exact verified hex `#306AC0`** (real YInMn Blue,
  already live on the site) — not an invented shade in the blue family.
  Every other blue used in mockups so far (`#215aa8`, `#1d4f92`, `#2f66ac`,
  `#7F00FF` violet) was a different, unrequested blue, not the one she
  actually asked for.

**Not artificially limited to two colors.** Several rounds treated "one
dominant + one accent" as if it were a hard ceiling. It isn't — a real
palette can be three, four, or more colors if there's a genuine reason for
each one. The two-color framing was a self-imposed constraint, not
something she asked for.

**The actual lesson, more important than any hex code — stated as a
checkable rule, not a theme:** in every rejected attempt, two colors
appeared at roughly the same saturation and covered roughly similar-sized
shapes in the same view (e.g. two same-size torn fragments, both
full-strength). That's the specific, checkable failure: no color competing
for the eye at the same intensity as another color anywhere in one view.
The working rule: one color covers the visual majority of the page (a
neutral base, or the single primary brand tone) — target roughly 70%+ of
the colored area. Additional colors are allowed only where each marks one
specific, distinct thing, and each should cover a small minority of the
composition — never a second same-size decorative shape sitting next to
the first.

**Process failure to stop repeating:** colors have been invented from
memory/guesswork across nearly every round instead of researched. Look at
real, professional color-palette references before picking anything —
verified sources, not a hex grabbed because it sounds like the right name
for a category.

## Layout

- Elevation = at minimum two stacked box-shadows per raised element (a
  tight, low-opacity contact shadow close to the edge, plus a larger, softer
  ambient shadow further out) — a single soft blur reads as flat, which is
  what happened in earlier rounds.
- No fading text or reduced opacity for a "muted" look — text color is
  always full-strength: near-black on light backgrounds, near-white on dark
  ones. Checkable: no text color should sit at a lighter/lower-contrast
  value than its surrounding body text just for a softened look.
- Direct, efficient wording — no dramatic-sounding language performing
  depth it doesn't have (same rule as CLAUDE.md's content-audit checklist).
- Checkable test for "recognizable template shape": if the composition is a
  single centered column with one dominant color block at the top and a
  white card below it, that's the rejected shape — regardless of color,
  redo the composition itself. At least one major element must be
  off-center, asymmetric, or bleed off a page edge; no version so far that
  centered everything in one vertical stack has been kept.

## Process note

She's explicitly said she wants to be *shown* things, not asked to
pre-specify what she can't articulate — guessing and building real,
rendered attempts is the right process. But each guess should actually
apply the principles above, not vary arbitrarily from the last one.
