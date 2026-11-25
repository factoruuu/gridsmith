/* GridSmith self-check — run with: node test.js
   Loads data.js + engine.js and verifies generated answers INDEPENDENTLY:
   arithmetic answers are recomputed by parsing the printed question text;
   multiple-choice answers must be among the options; reading/vocab banks are
   checked structurally. Also exercises buildSet for every grade/subject.   */
"use strict";
require("./data.js");
require("./engine.js");
const E = globalThis.GS_ENGINE;
const D = globalThis.GS_DATA;

let pass = 0, fail = 0;
const failures = [];
function check(cond, label, item) {
  if (cond) { pass++; }
  else {
    fail++;
    if (failures.length < 25) failures.push(label + " :: " + JSON.stringify(item && { q: item.q, answer: item.answer, steps: item.steps }));
  }
}
function strip(html) { return String(html).replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim(); }
function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a || 1; }
function parseFracAnswer(s) {
  s = String(s).trim();
  let m = s.match(/^(\d+) (\d+)\/(\d+)$/);           // mixed "1 1/2"
  if (m) return (Number(m[1]) * Number(m[3]) + Number(m[2])) / Number(m[3]);
  m = s.match(/^(\d+)\/(\d+)$/);
  if (m) return Number(m[1]) / Number(m[2]);
  m = s.match(/^\d+$/);
  if (m) return Number(s);
  return NaN;
}
function close(a, b) { return Math.abs(a - b) < 1e-9; }

const FACTOR = { "m|cm": 100, "kg|g": 1000, "L|mL": 1000, "hour|minutes": 60, "week|days": 7 };

function verifyMath(topic, item) {
  const t = strip(item.q);
  const ans = item.answer;
  let m;
  switch (topic) {
    case "addsub":
      if ((m = t.match(/What is (\d+) \+ (\d+)\?/))) return check(Number(m[1]) + Number(m[2]) === item.value && ans === String(item.value), "addsub +", item);
      if ((m = t.match(/What is (\d+) − (\d+)\?/))) return check(Number(m[1]) - Number(m[2]) === item.value && ans === String(item.value), "addsub -", item);
      if ((m = t.match(/____ \+ (\d+) = (\d+)/))) return check(Number(m[2]) - Number(m[1]) === item.value, "addsub missing", item);
      return check(false, "addsub unparsed: " + t, item);
    case "counting": {
      const stars = (item.q.match(/★/g) || []).length;
      return check(stars === item.value && ans === String(item.value), "counting stars=" + stars, item);
    }
    case "sequence": {
      const parts = t.replace("Complete the number sequence:", "").split(",").map(s => s.trim());
      const shown = parts.map(p => p === "____" ? null : Number(p));
      const diffs = [];
      for (let i = 1; i < shown.length; i++) if (shown[i] != null && shown[i - 1] != null) diffs.push(shown[i] - shown[i - 1]);
      const step = diffs[0];
      check(diffs.every(d => d === step), "sequence constant step", item);
      const full = shown.map((v, i) => v != null ? v : shown.find(x => x != null) + step * (i - shown.findIndex(x => x != null)));
      const expected = shown.map((v, i) => v == null ? full[i] : null).filter(v => v != null).join(", ");
      return check(ans === expected, "sequence answers exp=" + expected, item);
    }
    case "multdiv":
      if ((m = t.match(/What is (\d+) × (\d+)\?/))) return check(Number(m[1]) * Number(m[2]) === item.value, "multdiv ×", item);
      if ((m = t.match(/What is (\d+) ÷ (\d+)\? Give/))) {
        const dvd = Number(m[1]), dvs = Number(m[2]);
        const q = Math.floor(dvd / dvs), r = dvd % dvs;
        return check(ans === q + " r " + r, "multdiv ÷ rem exp=" + q + " r " + r, item);
      }
      if ((m = t.match(/What is (\d+) ÷ (\d+)\?/))) return check(Number(m[1]) / Number(m[2]) === item.value, "multdiv ÷", item);
      return check(false, "multdiv unparsed: " + t, item);
    case "fractionsBasic": {
      if (item.q.includes("fracbar")) {
        const on = (item.q.match(/seg on/g) || []).length;
        const totalSegs = (item.q.match(/class="seg/g) || []).length;
        const g = gcd(on, totalSegs);
        return check(ans === (on / g) + "/" + (totalSegs / g), "frac identify exp=" + (on / g) + "/" + (totalSegs / g), item);
      }
      if ((m = t.match(/Which fraction is bigger: (\d+)\/(\d+) or (\d+)\/(\d+)\?/))) {
        const v1 = Number(m[1]) / Number(m[2]), v2 = Number(m[3]) / Number(m[4]);
        const bigger = v1 > v2 ? m[1] + "/" + m[2] : m[3] + "/" + m[4];
        return check(ans === bigger, "frac compare exp=" + bigger, item);
      }
      if ((m = t.match(/has (\d+) .* (\d+)\/(\d+) of them are red/))) {
        return check(Number(m[1]) / Number(m[3]) * Number(m[2]) === item.value, "frac of set", item);
      }
      return check(false, "fracBasic unparsed: " + t, item);
    }
    case "measurement":
      if ((m = t.match(/Convert: (\d+) (\w+) = ____ (\w+)/))) {
        const f = FACTOR[m[2] + "|" + m[3]];
        return check(f && Number(m[1]) * f === item.value, "measure convert", item);
      }
      if ((m = t.match(/measures (\d+) (\w+) and another that measures (\d+) (\w+)/))) {
        const f = FACTOR[m[2] + "|" + m[4]] || (m[2] === m[4] ? 1 : NaN);
        return check(Number(m[1]) * f + Number(m[3]) === item.value, "measure word", item);
      }
      return check(false, "measurement unparsed: " + t, item);
    case "money": {
      const prices = [...t.matchAll(/\$(\d+)\.(\d{2})/g)].map(x => Number(x[1]) * 100 + Number(x[2]));
      if (t.includes("spend in all")) return check(prices[0] + prices[1] === item.value, "money total", item);
      if (t.includes("change")) return check(prices[1] - prices[0] === item.value, "money change", item);
      if ((m = t.match(/has (\d+) quarters/))) return check(Number(m[1]) * 25 === item.value, "money coins", item);
      if ((m = t.match(/How much do (\d+) of them cost/))) return check(Number(m[1]) * prices[0] === item.value, "money multi", item);
      return check(false, "money unparsed: " + t, item);
    }
    case "fractionsOps": {
      if ((m = t.match(/Calculate: (\d+)\/(\d+) ([+−×÷]) (\d+)\/(\d+)/))) {
        const a = Number(m[1]), b = Number(m[2]), op = m[3], c = Number(m[4]), d = Number(m[5]);
        const v = op === "+" ? a / b + c / d : op === "−" ? a / b - c / d : op === "×" ? (a / b) * (c / d) : (a / b) / (c / d);
        return check(close(parseFracAnswer(ans), v), "fracOps exp=" + v, item);
      }
      if ((m = t.match(/Calculate: (\d+) × (\d+)\/(\d+)/))) {
        return check(close(parseFracAnswer(ans), Number(m[1]) * Number(m[2]) / Number(m[3])), "fracOps wholeMul", item);
      }
      return check(false, "fracOps unparsed: " + t, item);
    }
    case "decimalsPercent": {
      if ((m = t.match(/Calculate: (\d+\.\d{2}) ([+−]) (\d+\.\d{2})/))) {
        const v = m[2] === "+" ? Number(m[1]) + Number(m[3]) : Number(m[1]) - Number(m[3]);
        return check(close(Number(ans), v), "dec add/sub exp=" + v, item);
      }
      if ((m = t.match(/Calculate: (\d+\.\d) × (100|10)/))) {
        return check(Number(ans) === Math.round(Number(m[1]) * Number(m[2])), "dec shift", item);
      }
      if ((m = t.match(/What is (\d+)% of (\d+)\?/))) {
        return check(close(item.value, Number(m[1]) / 100 * Number(m[2])) && ans === String(item.value), "pctOf", item);
      }
      if ((m = t.match(/Write (\d+)\/(\d+) as a percent/))) {
        return check(close(Number(m[1]) / Number(m[2]) * 100, parseFloat(ans)), "fracPct", item);
      }
      return check(false, "decPct unparsed: " + t, item);
    }
    case "ratio": {
      if ((m = t.match(/Simplify the ratio (\d+) : (\d+)/))) {
        const g = gcd(Number(m[1]), Number(m[2]));
        return check(ans === (Number(m[1]) / g) + ":" + (Number(m[2]) / g), "ratio simplify", item);
      }
      if ((m = t.match(/ratio of drawings to photos is (\d+) : (\d+)\. If there are (\d+) drawings/))) {
        return check(Number(m[3]) / Number(m[1]) * Number(m[2]) === item.value, "ratio scale", item);
      }
      if ((m = t.match(/ratio (\d+) : (\d+)\. The whole ribbon is (\d+) cm/))) {
        return check(Number(m[3]) / (Number(m[1]) + Number(m[2])) * Number(m[1]) === item.value, "ratio total", item);
      }
      return check(false, "ratio unparsed: " + t, item);
    }
    case "geometry": {
      if ((m = t.match(/rectangle is (\d+) cm long and (\d+) cm wide\. What is its perimeter/)))
        return check(2 * (Number(m[1]) + Number(m[2])) === item.value, "geo perimeter", item);
      if ((m = t.match(/garden bed is (\d+) m long and (\d+) m wide/)))
        return check(Number(m[1]) * Number(m[2]) === item.value, "geo area", item);
      if ((m = t.match(/square tile has sides of (\d+) cm/)))
        return check(Number(m[1]) * Number(m[1]) === item.value, "geo square", item);
      if ((m = t.match(/triangle has a base of (\d+) cm and a height of (\d+) cm/)))
        return check(Number(m[1]) * Number(m[2]) / 2 === item.value, "geo triangle", item);
      return check(false, "geometry unparsed: " + t, item);
    }
    case "multistep": {
      if ((m = t.match(/buys (\d+) notebooks? at \$(\d+)\.(\d{2}) each and pays with \$(\d+)\.(\d{2})/))) {
        const cost = Number(m[1]) * (Number(m[2]) * 100 + Number(m[3]));
        const bill = Number(m[4]) * 100 + Number(m[5]);
        return check(bill - cost === item.value, "multistep change", item);
      }
      if ((m = t.match(/packs (\d+) boxes with (\d+) .* in each box\. Then (\d+)/)))
        return check(Number(m[1]) * Number(m[2]) - Number(m[3]) === item.value, "multistep boxes", item);
      if ((m = t.match(/collect (\d+) .* among (\d+) children/)))
        return check(Number(m[1]) / Number(m[2]) === item.value, "multistep share", item);
      if ((m = t.match(/reads (\d+) pages every day for (\d+) days, then reads (\d+) more/)))
        return check(Number(m[1]) * Number(m[2]) + Number(m[3]) === item.value, "multistep pages", item);
      if ((m = t.match(/has (\d+) sections with (\d+) paragraphs each, plus an introduction of (\d+) paragraphs/)))
        return check(Number(m[1]) * Number(m[2]) + Number(m[3]) === item.value, "multistep theme", item);
      return check(false, "multistep unparsed: " + t, item);
    }
    case "word": {
      const nums = [...t.matchAll(/\d+/g)].map(x => Number(x[0]));
      if (t.includes("in all?")) return check(nums[0] + nums[1] === item.value, "wordA join", item);
      if (t.includes("have left?")) return check(nums[0] - nums[1] === item.value, "wordA takeaway", item);
      if (t.includes("does the one with more have?")) return check(Math.abs(nums[0] - nums[1]) === item.value, "wordA compare", item);
      if (t.includes("fact cards does")) return check(nums[0] + nums[1] === item.value, "wordA theme join", item);
      if (t.includes("flashcards does")) return check(nums[0] - nums[1] === item.value, "wordA theme take", item);
      return check(false, "wordA unparsed: " + t, item);
    }
  }
  return check(false, "no verifier for " + topic, item);
}

function verifyMC(item, label) {
  check(Array.isArray(item.options) && item.options.length >= 2, label + " has options", item);
  check(item.options.includes(item.answer), label + " answer in options", item);
  check(new Set(item.options).size === item.options.length, label + " options unique", item);
  check(item.steps && item.steps.length >= 1, label + " has explanation", item);
}

/* ---- run generators ---- */
const MATH_TOPICS = {
  A: ["addsub", "counting", "word", "sequence"],
  B: ["multdiv", "fractionsBasic", "measurement", "money"],
  C: ["fractionsOps", "decimalsPercent", "ratio", "geometry", "multistep"]
};
const GRADE_OF_BAND = { A: [1, 2], B: [3, 4], C: [5, 6] };
for (const band of ["A", "B", "C"]) {
  for (const grade of GRADE_OF_BAND[band]) {
    for (const topic of MATH_TOPICS[band]) {
      for (const diff of ["easy", "medium", "hard"]) {
        for (let i = 0; i < 300; i++) {
          const item = E.GENERATORS[topic](grade, diff, {});
          item.topicId = topic;
          check(typeof item.q === "string" && item.q.length > 3, topic + " q present", item);
          check(typeof item.answer === "string" && item.answer.length > 0, topic + " answer present", item);
          check(Array.isArray(item.steps) && item.steps.length >= 1, topic + " steps present", item);
          verifyMath(topic, item);
        }
      }
    }
  }
}
/* English MC generators */
for (const grade of [1, 2, 3, 4, 5, 6]) {
  for (const topic of ["vocab", "choose", "grammar"]) {
    if (topic === "choose" && grade <= 2) continue;
    for (let i = 0; i < 300; i++) {
      const item = E.GENERATORS[topic](grade, "medium", {});
      verifyMC(item, "eng " + topic + " g" + grade);
    }
  }
  // reading: every passage's keyed answer must match its own options list
  for (const p of D.PASSAGES) {
    for (const q of p.qs) {
      check(q.options[q.answer] !== undefined, "passage " + p.id + " answer idx valid", q);
      check(new Set(q.options).size === q.options.length, "passage " + p.id + " options unique", q);
    }
  }
}
/* grammar semantic spot-verification: is/are + a/an agreement */
for (let i = 0; i < 500; i++) {
  const it = E.GENERATORS.grammar(1, "easy", {});
  const t = strip(it.q);
  let mm;
  if ((mm = t.match(/"(.*?) ___/))) {
    const subj = mm[1];
    const plurals = ["The dogs", "My friends", "They", "We", "The birds", "Tom and Ana", "The children"];
    if (it.options.includes("are") && it.options.includes("is")) {
      check(it.answer === (plurals.includes(subj) ? "are" : "is"), "is/are agreement subj=" + subj, it);
    }
  }
  if ((mm = t.match(/see ___ (\w+)/))) {
    const noun = mm[1];
    const vowelStart = /^[aeiou]/i.test(noun);
    check(it.answer === (vowelStart ? "an" : "a"), "a/an noun=" + noun, it);
  }
}
/* buildSet across all combos */
for (let grade = 1; grade <= 6; grade++) {
  for (const subject of ["math", "english"]) {
    for (const total of [5, 10, 15, 20]) {
      const topics = E.topicsFor(grade, subject).map(t => t.id);
      const res = E.buildSet({ grade, subject, total, weights: { easy: 4, medium: 4, hard: 2 }, topicIds: topics, themes: [] });
      check(res.items.length === total, `buildSet g${grade} ${subject} total=${total} got ${res.items.length}`, null);
      const qs = res.items.map(i => i.q);
      check(new Set(qs).size === qs.length, `buildSet g${grade} ${subject} total=${total} duplicates`, null);
      for (const item of res.items) {
        check(item.answer !== undefined && item.steps && item.steps.length >= 1, "buildSet item complete", item);
        if (item.kind === "mc" || item.kind === "reading") verifyMC(item, "buildSet mc");
      }
    }
  }
}
/* grid parsing */
const parsed = E.parseGrid("1. Penjumlahan dan pengurangan\n2. Pecahan sederhana\n3. Perkalian\n- Kehidupan laut dalam", 4, "math");
check(parsed.topicIds.includes("addsub") || parsed.topicIds.includes("multdiv"), "grid ID math topics", parsed);
check(parsed.themes.includes("Kehidupan laut dalam"), "grid theme fallback", parsed);
const parsedEn = E.parseGrid("Vocabulary: animals\nReading comprehension\nPast tense grammar", 5, "english");
check(parsedEn.topicIds.includes("vocab") && parsedEn.topicIds.includes("reading") && parsedEn.topicIds.includes("grammar"), "grid EN topics", parsedEn);

console.log(`\nGridSmith self-check: ${pass} passed, ${fail} failed`);
if (failures.length) { console.log("\nFirst failures:"); failures.forEach(f => console.log(" - " + f)); }
process.exit(fail ? 1 : 0);
