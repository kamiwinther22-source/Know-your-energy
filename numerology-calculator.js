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

function isVowelChar(ch, index, letters) {
  if (VOWELS.has(ch)) return true;
  if (ch !== "Y") return false;
  if (index === 0) return false;
  const prev = letters[index - 1];
  if (VOWELS.has(prev)) return false;
  return true;
}

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
  return nameBasedNumber([first, middle, last], null);
}

function calculateSoulUrge(first, middle, last) {
  return nameBasedNumber([first, middle, last], (ch, i, letters) => isVowelChar(ch, i, letters));
}

function calculatePersonality(first, middle, last) {
  return nameBasedNumber([first, middle, last], (ch, i, letters) => !isVowelChar(ch, i, letters));
}

function calculateBirthdayNumber(dob) {
  const { day } = parseDate(dob);
  return { value: day, karmicDebt: null };
}

function calculateAttitudeNumber(dob) {
  const { month, day } = parseDate(dob);
  const m = reducePreserveMasters(month).value;
  const d = reducePreserveMasters(day).value;
  return reducePreserveMasters(m + d);
}

function calculateBalanceNumber(first, middle, last) {
  const parts = [first, middle, last].filter((p) => p && p.trim().length > 0);
  const total = parts.reduce((sum, part) => {
    const firstLetter = part.toUpperCase().replace(/[^A-Z]/g, "")[0];
    return sum + (LETTER_VALUES[firstLetter] || 0);
  }, 0);
  return reducePreserveMasters(total);
}

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

function calculatePeriodCycles(dob, lifePathRawValue) {
  const { month, day, year } = parseDate(dob);
  const period1 = reducePreserveMasters(month);
  const period2 = reducePreserveMasters(day);
  const period3 = reducePreserveMasters(year);

  const lifePathForAgeFormula = reduceFully(lifePathRawValue);
  const firstPeriodEndAge = 37 - lifePathForAgeFormula;
  const secondPeriodEndAge = firstPeriodEndAge + 27;

  return {
    period1: { value: period1.value, ageRange: `birth–${firstPeriodEndAge}` },
    period2: { value: period2.value, ageRange: `${firstPeriodEndAge + 1}–${secondPeriodEndAge}` },
    period3: { value: period3.value, ageRange: `${secondPeriodEndAge + 1}–onward` }
  };
}

function calculateMaturityNumber(lifePathValue, expressionValue) {
  return reducePreserveMasters(lifePathValue + expressionValue);
}

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

function calculateKarmicLessons(first, middle, last) {
  const fullName = [first, middle, last].filter(Boolean).join("");
  const valuesPresent = new Set(nameLetterValues(fullName));
  const missing = [];
  for (let i = 1; i <= 9; i++) {
    if (!valuesPresent.has(i)) missing.push(i);
  }
  return missing;
}

function calculateSubconsciousSelf(karmicLessonsArray) {
  return 9 - karmicLessonsArray.length;
}

function calculateFullChart(person) {
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

  const { month, day, year } = parseDate(dob);
  const rawLifePathForPinnacles = (() => {
    const m = reducePreserveMasters(month).value;
    const d = reducePreserveMasters(day).value;
    const y = reducePreserveMasters(year).value;
    return reducePreserveMasters(m + d + y).value;
  })();

  const pinnacles = calculatePinnacles(dob, rawLifePathForPinnacles);
  const periodCycles = calculatePeriodCycles(dob, rawLifePathForPinnacles);
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
    periodCycles: periodCycles,
    maturity: maturity.value,
    personalYear: personalYear.value,
    personalMonth: personalMonth.value,
    personalDay: personalDay.value,
    essenceCycle: { value: essence.value, currentAge: age },
    karmicLessons: karmicLessons,
    subconsciousSelf: subconsciousSelf,
    karmicDebtNumbers: [...new Set(karmicDebtNumbers)].sort((a, b) => a - b),
    masterNumbersPresent: [lifePath.value, expression.value, soulUrge.value, personality.value]
      .filter((v) => MASTER_NUMBERS.includes(v))
  };
}

export { calculateFullChart };
