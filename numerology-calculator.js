/**
 * PYTHAGOREAN NUMEROLOGY CALCULATOR
 * ----------------------------------
 * Full-chart calculator built from the standard, documented Pythagorean
 * numerology system. No external API calls, no vendor, no cost. Runs
 * entirely inside your own code.
 *
 * Returns RAW NUMBERS ONLY — no interpretive text. Interpretation is
 * intentionally left to Claude downstream, per your architecture.
 *
 * ============================================================
 * LOCKED CONTRACT — DO NOT CHANGE WITHOUT EXPLICIT SIGN-OFF:
 * 1. calculateFullChart() takes exactly ONE person and returns
 *    exactly ONE set of numbers for that person. Nothing else.
 * 2. There is NO compatibility, bridge, or cross-comparison logic
 *    in this file, and there never should be. For a two-person
 *    reading, calling code (worker.js) calls this function twice —
 *    once per person — and passes both plain results to Claude.
 *    All comparison between two people happens in Claude's prompt,
 *    never inside this calculator.
 * 3. Formulas in this file are verified against Kami's own known
 *    chart (Life Path 22) as of the date they were last confirmed
 *    correct. Any future formula change must be re-verified against
 *    a real, known chart before being trusted — see the "KNOWN
 *    UNVERIFIED EDGE CASES" note below for what hasn't been tested yet.
 * ============================================================
 *
 * KNOWN UNVERIFIED EDGE CASES (not yet tested against a real chart):
 * - Hyphenated or apostrophe'd names (Smith-Jones, O'Brien)
 * - Master numbers appearing in Expression, Soul Urge, or Personality
 *   (only verified so far for Life Path)
 * - Leap years and other date edge cases
 * - No input validation on malformed dates (Feb 31, etc.)
 *
 * Input shape expected by calculateFullChart():
 * {
 *   first: "Jane",
 *   middle: "Ann",       // optional, pass "" if none. If more than one
 *                        // middle name, they belong together in this
 *                        // single field (see frontend input guidance).
 *   last: "Doe",
 *   dob: "07/16/1990",   // MM/DD/YYYY
 *   currentDate: "07/05/2026" // MM/DD/YYYY — for Personal Year/Month/Day + Essence
 * }
 */

// ---------- LETTER VALUE MAP (Pythagorean) ----------
const LETTER_VALUES = {
  A: 1, J: 1, S: 1,
  B: 2, K: 2, T: 2,
  C: 3, L: 3, U: 3,
  D: 4, M: 4, V: 4,
  E: 5, N: 5, W: 5,
  F: 6, O: 6, X: 6,
  G: 7, P: 7, Y: 7,
  H: 8, Q: 8, Z: 8,
  I: 9, R: 9
};

const VOWELS = new Set(["A", "E", "I", "O", "U"]);
const MASTER_NUMBERS = [11, 22, 33];
const KARMIC_DEBT_NUMBERS = [13, 14, 16, 19];

// Y as a vowel: Y counts as a vowel when it's the only vowel SOUND in its
// syllable — practically, when it is not word-initial and not immediately
// preceded by a true vowel letter.
//   - Word-initial Y is a consonant glide: Yolanda, Yes, Young, Yvonne.
//   - Y immediately after a true vowel closes a diphthong, so it's a
//     consonant: Kay, Faye, Joy, Toy, Player.
//   - Y after a consonant, not word-initial, carries the vowel sound itself:
//     Lynn, Ryan, Bryan, Kyle, Tyler, Sylvia, Cyndi, Rhythm, Myth.
// Verified against all of the above names before being trusted here.
function isVowelChar(ch, index, letters) {
  if (VOWELS.has(ch)) return true;
  if (ch !== "Y") return false;
  if (index === 0) return false;
  const prev = letters[index - 1];
  if (VOWELS.has(prev)) return false;
  return true;
}

// ---------- CORE REDUCTION HELPERS ----------

// Reduces a number to a single digit, UNLESS it's a Master Number (11/22/33).
// Also flags Karmic Debt if 13/14/16/19 appears at any point during reduction.
function reducePreserveMasters(num) {
  let karmicDebt = null;
  let n = num;
  while (n > 9 && !MASTER_NUMBERS.includes(n)) {
    if (KARMIC_DEBT_NUMBERS.includes(n) && karmicDebt === null) {
      karmicDebt = n;
    }
    n = String(n).split("").reduce((sum, d) => sum + Number(d), 0);
  }
  return { value: n, karmicDebt };
}

// Fully reduces to a single digit regardless of Master Numbers.
// Used for Challenge Number inputs, where master birth components
// are fully reduced before subtraction (standard rule for this calculation).
function reduceFully(num) {
  let n = num;
  while (n > 9) {
    n = String(n).split("").reduce((sum, d) => sum + Number(d), 0);
  }
  return n;
}

function nameLetterValues(name) {
  return name
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .split("")
    .map((ch) => LETTER_VALUES[ch]);
}

function sumLetters(name, filterFn) {
  const letters = name.toUpperCase().replace(/[^A-Z]/g, "").split("");
  return letters
    .filter((ch, i) => (filterFn ? filterFn(ch, i, letters) : true))
    .reduce((sum, ch) => sum + LETTER_VALUES[ch], 0);
}

// Reduces each name segment separately (preserving masters within each),
// then sums the segment results and reduces the total (preserving masters).
// This is the standard approach for name-based numbers.
function nameBasedNumber(nameParts, filterFn) {
  let karmicDebt = null;
  const segmentTotal = nameParts
    .filter((part) => part && part.trim().length > 0)
    .reduce((total, part) => {
      const rawSum = sumLetters(part, filterFn);
      const reduced = reducePreserveMasters(rawSum);
      if (reduced.karmicDebt && karmicDebt === null) karmicDebt = reduced.karmicDebt;
      return total + reduced.value;
    }, 0);

  const final = reducePreserveMasters(segmentTotal);
  if (final.karmicDebt && karmicDebt === null) karmicDebt = final.karmicDebt;

  return { value: final.value, karmicDebt };
}

function parseDate(dateStr) {
  const [month, day, year] = dateStr.split("/").map(Number);
  return { month, day, year };
}

// ---------- CORE NUMBERS ----------

function calculateLifePath(dob) {
  const { month, day, year } = parseDate(dob);
  const m = reducePreserveMasters(month);
  const d = reducePreserveMasters(day);
  const y = reducePreserveMasters(year);
  const total = m.value + d.value + y.value;
  const final = reducePreserveMasters(total);

  const karmicDebt = m.karmicDebt || d.karmicDebt || y.karmicDebt || final.karmicDebt || null;
  return { value: final.value, karmicDebt };
}

function calculateExpression(first, middle, last) {
  return nameBasedNumber([first, middle, last], null); // all letters
}

function calculateSoulUrge(first, middle, last) {
  return nameBasedNumber([first, middle, last], (ch, i, letters) => isVowelChar(ch, i, letters));
}

function calculatePersonality(first, middle, last) {
  return nameBasedNumber([first, middle, last], (ch, i, letters) => !isVowelChar(ch, i, letters));
}

function calculateBirthdayNumber(dob) {
  const { day } = parseDate(dob);
  return reducePreserveMasters(day);
}

// ---------- ATTITUDE / SUN NUMBER ----------
// The outward first impression a person gives off — distinct from Personality.
// Calculated from birth month + birth day only (not year).
function calculateAttitudeNumber(dob) {
  const { month, day } = parseDate(dob);
  const m = reducePreserveMasters(month).value;
  const d = reducePreserveMasters(day).value;
  return reducePreserveMasters(m + d);
}

// ---------- BALANCE NUMBER ----------
// How a person handles stress and conflict, calculated from the FIRST LETTER
// of each name part (First/Middle/Last), summed and reduced.
function calculateBalanceNumber(first, middle, last) {
  const parts = [first, middle, last].filter((p) => p && p.trim().length > 0);
  const total = parts.reduce((sum, part) => {
    const firstLetter = part.toUpperCase().replace(/[^A-Z]/g, "")[0];
    return sum + (LETTER_VALUES[firstLetter] || 0);
  }, 0);
  return reducePreserveMasters(total);
}

// ---------- CHALLENGE NUMBERS ----------
// Master birth-date components are FULLY reduced before subtraction
// (this differs from Life Path, where masters are preserved).
function calculateChallengeNumbers(dob) {
  const { month, day, year } = parseDate(dob);
  const m = reduceFully(month);
  const d = reduceFully(day);
  const y = reduceFully(year);

  const challenge1 = Math.abs(m - d);
  const challenge2 = Math.abs(d - y);
  const challenge3 = Math.abs(challenge1 - challenge2);
  const challenge4 = Math.abs(m - y);

  return { challenge1, challenge2, challenge3, challenge4 };
}

// ---------- PINNACLE NUMBERS ----------
// The PINNACLE VALUES themselves preserve master numbers (11/22/33), but the
// AGE FORMULA ("36 minus Life Path") uses the Life Path number FULLY REDUCED
// to a single digit, even when the actual Life Path is a master number. These
// are two separate rules applied to two different things — the previous
// version of this file conflated them and used the raw master number in the
// age formula, which is the bug that gave wrong Pinnacle age ranges.
function calculatePinnacles(dob, lifePathRawValue) {
  const { month, day, year } = parseDate(dob);
  const m = reducePreserveMasters(month).value;
  const d = reducePreserveMasters(day).value;
  const y = reducePreserveMasters(year).value;

  const p1 = reducePreserveMasters(m + d);
  const p2 = reducePreserveMasters(d + y);
  const p3 = reducePreserveMasters(p1.value + p2.value);
  const p4 = reducePreserveMasters(m + y);

  const lifePathForAgeFormula = reduceFully(lifePathRawValue);
  const firstCycleEndAge = 36 - lifePathForAgeFormula;

  return {
    pinnacle1: { value: p1.value, ageRange: `birth–${firstCycleEndAge}` },
    pinnacle2: { value: p2.value, ageRange: `${firstCycleEndAge + 1}–${firstCycleEndAge + 9}` },
    pinnacle3: { value: p3.value, ageRange: `${firstCycleEndAge + 10}–${firstCycleEndAge + 18}` },
    pinnacle4: { value: p4.value, ageRange: `${firstCycleEndAge + 19}–onward` }
  };
}

// ---------- MATURITY NUMBER ----------
// Who a person grows into later in life. Life Path + Expression, reduced.
// Relevant for long-term trajectory, not just who someone is right now.
function calculateMaturityNumber(lifePathValue, expressionValue) {
  return reducePreserveMasters(lifePathValue + expressionValue);
}

// ---------- PERSONAL YEAR / MONTH / DAY ----------
function calculatePersonalYear(dob, currentDate) {
  const { month, day } = parseDate(dob);
  const { year: currentYear } = parseDate(currentDate);
  const total = month + day + currentYear;
  return reducePreserveMasters(
    String(total).split("").reduce((s, d2) => s + Number(d2), 0)
  );
}

function calculatePersonalMonth(personalYearValue, currentDate) {
  const { month: currentMonth } = parseDate(currentDate);
  return reducePreserveMasters(personalYearValue + currentMonth);
}

function calculatePersonalDay(personalMonthValue, currentDate) {
  const { day: currentDay } = parseDate(currentDate);
  return reducePreserveMasters(personalMonthValue + currentDay);
}

// ---------- ESSENCE CYCLES ----------
// Tracks which letter is "active" in each name segment (First/Middle/Last)
// at a given age, based on each letter's numerology value = years of influence.
// Sums the currently-active letters across segments, reduces (preserving masters).

function activeLetterAtAge(name, age) {
  const letters = name.toUpperCase().replace(/[^A-Z]/g, "").split("");
  if (letters.length === 0) return 0;

  let remainingAge = age;
  let index = 0;

  while (true) {
    const letter = letters[index % letters.length];
    const duration = LETTER_VALUES[letter];

    if (remainingAge < duration) {
      return LETTER_VALUES[letter];
    }
    remainingAge -= duration;
    index += 1;
  }
}

function calculateEssenceForAge(first, middle, last, age) {
  const segments = [first, middle, last].filter((s) => s && s.trim().length > 0);
  const total = segments.reduce((sum, part) => sum + activeLetterAtAge(part, age), 0);
  return reducePreserveMasters(total);
}

function getCurrentAge(dob, currentDate) {
  const birth = parseDate(dob);
  const now = parseDate(currentDate);
  let age = now.year - birth.year;
  const birthdayPassedThisYear =
    now.month > birth.month || (now.month === birth.month && now.day >= birth.day);
  if (!birthdayPassedThisYear) age -= 1;
  return age;
}

// ---------- KARMIC LESSONS ----------
// Numbers 1-9 that never appear anywhere in the letter-value conversion
// of the full birth name.
function calculateKarmicLessons(first, middle, last) {
  const fullName = [first, middle, last].filter(Boolean).join("");
  const valuesPresent = new Set(nameLetterValues(fullName));
  const missing = [];
  for (let i = 1; i <= 9; i++) {
    if (!valuesPresent.has(i)) missing.push(i);
  }
  return missing;
}

// ---------- SUBCONSCIOUS SELF NUMBER ----------
// Reflects how well someone draws on inner resources during sudden crises
// or unexpected events. Calculated as 9 minus the count of Karmic Lessons
// (missing numbers 1-9 in the full birth name) — fewer missing numbers
// means more numbers to draw on, and a higher Subconscious Self.
function calculateSubconsciousSelf(karmicLessonsArray) {
  return 9 - karmicLessonsArray.length;
}

// ---------- FULL CHART ----------

function calculateFullChart(person) {
  // Runtime guard: this function is locked to single-person input only.
  // If calling code accidentally passes two people's data (e.g. a
  // "person1"/"person2" wrapper, or an array), fail loudly rather than
  // silently computing something wrong.
  if (Array.isArray(person) || "person1" in (person || {}) || "person2" in (person || {})) {
    throw new Error(
      "calculateFullChart() takes exactly ONE person. For two-person readings, call this function twice — once per person — from worker.js."
    );
  }

  const { first, middle = "", last, dob, currentDate } = person;

  const lifePath = calculateLifePath(dob);
  const expression = calculateExpression(first, middle, last);
  const soulUrge = calculateSoulUrge(first, middle, last);
  const personality = calculatePersonality(first, middle, last);
  const birthday = calculateBirthdayNumber(dob);
  const attitude = calculateAttitudeNumber(dob);
  const balance = calculateBalanceNumber(first, middle, last);
  const challenges = calculateChallengeNumbers(dob);

  // Pinnacles need the raw (pre-final-reduction) Life Path number for age-range math.
  // We recompute the un-reduced month+day+year sum here to get that raw value.
  const { month, day, year } = parseDate(dob);
  const rawLifePathForPinnacles = (() => {
    const m = reducePreserveMasters(month).value;
    const d = reducePreserveMasters(day).value;
    const y = reducePreserveMasters(year).value;
    return reducePreserveMasters(m + d + y).value;
  })();

  const pinnacles = calculatePinnacles(dob, rawLifePathForPinnacles);
  const maturity = calculateMaturityNumber(lifePath.value, expression.value);

  const personalYear = calculatePersonalYear(dob, currentDate);
  const personalMonth = calculatePersonalMonth(personalYear.value, currentDate);
  const personalDay = calculatePersonalDay(personalMonth.value, currentDate);

  const age = getCurrentAge(dob, currentDate);
  const essence = calculateEssenceForAge(first, middle, last, age);

  const karmicLessons = calculateKarmicLessons(first, middle, last);
  const subconsciousSelf = calculateSubconsciousSelf(karmicLessons);

  const karmicDebtNumbers = [
    lifePath.karmicDebt,
    expression.karmicDebt,
    soulUrge.karmicDebt,
    personality.karmicDebt
  ].filter(Boolean);

  return {
    lifePath: lifePath.value,
    expression: expression.value,
    soulUrge: soulUrge.value,
    personality: personality.value,
    birthday: birthday.value,
    attitude: attitude.value,
    balance: balance.value,
    challengeNumbers: challenges,
    pinnacles: pinnacles,
    maturity: maturity.value,
    personalYear: personalYear.value,
    personalMonth: personalMonth.value,
    personalDay: personalDay.value,
    essenceCycle: { value: essence.value, currentAge: age },
    karmicLessons: karmicLessons,
    subconsciousSelf: subconsciousSelf,
    karmicDebtNumbers: [...new Set(karmicDebtNumbers)],
    masterNumbersPresent: [lifePath.value, expression.value, soulUrge.value, personality.value]
      .filter((v) => MASTER_NUMBERS.includes(v))
  };
}

// ---------- EXPORT ----------
// In a Cloudflare Worker, import this directly:
//   import { calculateFullChart } from './numerology-calculator.js';
export { calculateFullChart };
