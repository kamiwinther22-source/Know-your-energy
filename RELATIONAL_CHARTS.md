# Relational charts — Claude API interpretation directions (astrology)

**Status: reference material for future work, not yet implemented.** These
are her directions for how the Claude API should interpret two-person
astrology comparisons (Synastry + Composite). Nothing in the app currently
generates relational charts — this file exists so the directions aren't
lost before that feature is built. **These will be tweaked to also
incorporate numerology and Human Design** once the astrology layer is
settled — don't treat this as astrology-only forever, but astrology is the
first (and so far only) system spec'd out.

Relationship type is not one-size-fits-all: the same two core techniques
(Synastry, Composite) get re-interpreted through a different lens depending
on whether the pairing is romantic, non-romantic (business/friendship/
creative), or parent-child. The question set below is organized by
relationship type for that reason.

---

## Core method: two techniques, two different questions

- **Synastry** — overlays Person A's chart directly onto Person B's chart.
  Answers how the two people directly trigger, support, or challenge each
  other (interpersonal dynamics, chemistry, friction).
- **Composite chart** — a third, separate chart built from the mathematical
  midpoints between the two people's planets. Answers what the
  *relationship itself* is, as its own entity — not what either person
  feels, but what the partnership/bond functions as and is oriented toward.

---

## 1. Romantic relationships

### Synastry questions
| Question | Evaluated through |
|---|---|
| Where is the immediate attraction/chemistry? | Venus & Mars aspects; contacts to the Ascendant |
| How do we communicate & intellectually connect? | Mercury interactions |
| Do we offer each other emotional safety? | Moon interactions |
| Where are the friction points, triggers, conflicts? | Hard aspects (squares/oppositions) to Mars, Saturn, outer planets (Uranus/Neptune/Pluto) |
| Karmic ties, heavy obligations, lessons? | Saturn contacts; Lunar Node connections |
| How does one person practically impact the other's life? | House overlays (A's planets falling in B's houses — e.g. 10th = career impact, 8th = shared resources, 6th = daily routine) |

### Composite chart questions
| Question | Evaluated through |
|---|---|
| Core purpose/identity/"mission" of the relationship? | Composite Sun (sign + house) |
| Emotional tone & rhythm of the partnership? | Composite Moon |
| How does the couple handle conflict/stress/joint action? | Composite Mars |
| Structural longevity, staying power? | Composite Saturn |
| How is the relationship perceived by the outside world? | Composite Ascendant + Midheaven (10th house) |

---

## 2. Non-romantic relationships (business, friendship, creative collaboration)

Same two techniques, but the lens shifts from romance to practical/
professional/platonic cooperation. Venus/Mars-as-romance is replaced by
Mercury/Mars-as-working-style, and Saturn becomes a *desirable* signal
(reliability, structural backing) rather than a restriction to watch for.

### Synastry questions
| Question | Evaluated through |
|---|---|
| How do we work together day to day? | Mercury (communication/problem-solving style); 6th House overlays (impact on daily routine/work environment) |
| Where do we clash in ambition, pacing, authority? | Mars (drive, competition, how anger is expressed); Sun-Saturn aspects (feeling bossed around/micromanaged/restricted) |
| Can we build financial security or business trust? | Jupiter & Saturn contacts; 2nd & 8th House interactions (shared finances, assets, business resources) |
| Is there mutual respect and institutional support? | Saturn contacts — here, strong Saturn links are a *positive* (reliability, professionalism, long-term commitment), unlike in romance |
| How do we handle intellectual disagreements or shared projects? | Mercury-to-Mercury and Mercury-to-outer-planet aspects |

### Composite chart questions
| Question | Evaluated through |
|---|---|
| Primary goal/output of the partnership? | Composite Sun + Midheaven (10th House) |
| Financial/material potential? | Composite 2nd, 8th, 10th Houses; Jupiter placements |
| How does it handle stress, crises, operational conflict? | Composite Mars |
| Staying power, structural integrity? | Composite Saturn |
| Internal working atmosphere / team culture? | Composite Moon |

---

## 3. Parent-child relationships

Same core tools, but the interpretation shifts entirely toward
developmental psychology, authority, nurture, and generational patterns —
because the dynamic is inherently asymmetrical (caregiver/authority vs.
developing/dependent), analysis centers on how the parent's chart meets the
child's developmental needs, not on chemistry.

### Synastry questions
| Question | Evaluated through |
|---|---|
| How does the child instinctively feel loved/nurtured/secure with this parent? | Child's Moon sign vs. parent's Moon/Venus placements |
| How do we communicate — will the child feel understood? | Mercury contacts; 3rd House overlays |
| Where will there be power struggles, discipline issues, clashes of will? | Mars & Saturn contacts; hard aspects to the child's Sun/Moon |
| What life lessons, karma, or generational patterns are playing out? | Saturn contacts; Lunar Node (North/South) connections |
| How does the parent practically impact the child's development, routine, identity? | House overlays (e.g. parent's planets in child's 4th House = foundational security; 10th House = career aspirations) |

### Composite chart questions
| Question | Evaluated through |
|---|---|
| Overall emotional atmosphere / "home climate" together? | Composite Moon + 4th House |
| How does the family unit handle discipline, rules, boundaries? | Composite Saturn |
| Central focus or lesson of this pairing? | Composite Sun + its aspects |
| How does the dynamic handle stress, tantrums, family crises? | Composite Mars |

---

## Implementation notes (for whenever this is built)

- Not yet wired into `worker.js` or `index.html` — no relational-chart
  endpoint, prompt, or UI exists today. `/report` currently generates
  single-person readings only.
- Astrology is computed locally per-person via `astro-engine.js`
  (`computeAstrology`) already — a relational feature would need to run it
  for both people, then either (a) compute synastry aspects/house-overlays
  directly, or (b) hand both raw charts to the Claude API and let the
  `/report`-style prompt do the interpretive work per the questions above.
  Composite chart midpoints would need real calculation (not just prompting
  Claude to "imagine" a composite) if displayed as an actual chart, but
  could be prompt-only if only the *interpretation* is shown.
- Per this file's directions, relationship type must be selected/known
  (romantic / non-romantic / parent-child) before generating an
  interpretation, since the same planets map to different questions
  depending on type.
- **To be extended**: incorporate numerology (e.g. Life Path/Expression
  compatibility, shared Personal Year themes) and Human Design (e.g.
  Electromagnetic/Compromise/Dominance channel connections between two
  BodyGraphs) into the same relational framework. Not spec'd out yet —
  astrology is the only system with directions so far.
