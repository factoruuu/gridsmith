# GridSmith

**Practice sets, forged from your curriculum grid.**

GridSmith turns a teacher's curriculum grid (*kisi-kisi*) into a ready-to-print elementary
practice set — leveled Easy / Medium / Hard, with a fully worked answer key — in seconds,
in the browser, with no account and no internet connection.

_Screenshot: GridSmith reading an Indonesian curriculum grid and generating a Grade 4 mathematics worksheet — attached to the Devpost project page._

## The problem

Every week, elementary teachers and parents face the same late-night task: turning a
curriculum grid — the official list of topics an exam will cover — into good practice
questions. It is slow, repetitive work. Generic question banks rarely match the grid,
the grade, or the difficulty balance a teacher needs, and most "generators" produce
questions with no worked solutions, so checking a child's answers becomes a second job.

This project began with a real request: a parent asked for practice sets built from her
child's Grade 2 curriculum grid. GridSmith is that request, turned into a tool anyone can use.

## Who it's for

- **Elementary teachers (Grades 1–6)** preparing homework, quizzes and exam drills.
- **Parents** who receive a curriculum grid from school and want matching practice at home.
- **Tutors** who need a fresh set for every student, every session — never the same numbers twice.

## What it does

1. **Pick or paste.** Choose a grade (1–6), a subject (Mathematics or English Language),
   and topics from checkboxes — or paste a curriculum grid, one topic per line, in
   **English or Bahasa Indonesia**.
2. **Grid mapping.** Each pasted line is matched against a bilingual keyword map
   (e.g. *pecahan* → Fractions, *perkalian* → Multiplication & Division). Lines that match
   nothing are not discarded: they become **themes for word problems**, so a line like
   *"Kehidupan di laut dalam"* (deep-sea life) produces story problems about that theme.
   The app shows you exactly how every line was read.
3. **Leveled generation.** Set the number of questions (5 / 10 / 15 / 20) and the
   Easy / Medium / Hard mix with sliders. Every question is generated fresh — numbers,
   names, objects and stories are randomized on every run.
4. **Worked answer key.** A toggleable answer key gives every answer **and** a
   step-by-step explanation written for the teacher or parent (column addition with
   carrying, common-denominator steps for fractions, "flip and multiply" for division…).
5. **Print / PDF.** The student worksheet prints cleanly with name/class/date/score
   lines; the answer key starts on its own page and can be included or excluded.

## How the generation engine works

GridSmith is deliberately honest engineering — there are no fake "AI" calls and no
server. The intelligence lives in three local layers:

- **Parameterized question engines** (`engine.js`): one generator per topic, each
  sampling its own numbers, names and story frames, then *deriving* the answer and the
  worked explanation from the same parameters — so an explanation can never disagree
  with its answer. Mathematics covers addition/subtraction with regrouping (column-method
  explanations), counting, sequences, multiplication/division, fractions (visual bars,
  comparison, operations), measurement conversion, money in dollars (integer-cent
  arithmetic, so no rounding errors), decimals & percent, ratio, area/perimeter and
  multi-step problems. English uses template + curated-bank generators: vocabulary in
  context, "choose the correct word" (their/there, affect/effect…), grammar
  (is/are, a/an, past tense, subject–verb agreement, comparatives) and reading.
- **Curated reading bank** (`data.js`): six original passages, each with three
  comprehension questions whose keys cite the passage.
- **A bilingual curriculum-grid parser**: keyword mapping for English and Indonesian
  topic lines, with a theme fallback for unmatched lines.

**Correctness is tested, not hoped for.** `test.js` runs the engine headlessly and
independently recomputes the answer to tens of thousands of generated questions by
parsing the printed question text back (117,000+ checks), verifies every
multiple-choice key against its options, checks is/are and a/an agreement
semantically, and confirms the set builder returns exact counts with no duplicates
for every grade/subject/size combination:

```bash
node test.js   # → GridSmith self-check: 117019 passed, 0 failed
```

## How to run

No build step, no dependencies, no server required:

1. Download or clone this folder.
2. Open `index.html` in any modern browser. (Serving it with any static file
   server works too.)

Optional demo links (handy for reviewers):

- `index.html?demo=grid` — pre-fills an Indonesian curriculum grid and generates a set.
- `index.html?demo=english` — a Grade 5 English set with a reading passage and the key open.
- `index.html?demo=key` — a Grade 3 mathematics set with the answer key open.

## Tech used

- Plain **HTML, CSS and JavaScript** — zero dependencies, zero build, zero network calls.
- CSS custom properties + grid layout for the responsive UI; dedicated `@media print`
  stylesheet for the worksheet/answer-key pagination.
- Node.js (only for the offline self-check in `test.js`; not needed to use the app).

## Screenshots

**1. A pasted curriculum grid becomes a worksheet** — the panel shows how each
Indonesian line was mapped, and unmatched lines become word-problem themes.

_Curriculum grid mapping and generated worksheet — screenshot attached to the Devpost project page._

**2. The answer key** — every answer with a worked, step-by-step explanation.

_Answer key with worked explanations — screenshot attached to the Devpost project page._

**3. English with reading** — an original passage with comprehension questions,
vocabulary, "choose the word" and grammar in one set.

_English set with reading passage — screenshot attached to the Devpost project page._

## Project structure

| File | Purpose |
| --- | --- |
| `index.html` | Page structure and controls |
| `style.css` | Design system, responsive layout, print stylesheet |
| `app.js` | UI wiring and rendering (worksheet + answer key) |
| `engine.js` | Question generators, grid parser, set builder (pure, testable) |
| `data.js` | Topic catalogue, word/name banks, vocabulary & reading banks, keyword map |
| `test.js` | Node self-check that independently verifies generated answers |
| `screenshots/` | Screenshots for the Devpost listing (kept locally; binary files are attached on Devpost) |

## Built for

SLAY HACKS 2026 (Devpost) — a global online AI hackathon. GridSmith's contribution is
applied, verifiable "AI-era" assistance for education: curriculum understanding
(bilingual grid parsing), generative question engines, and explanations a parent can
actually teach from — all running locally, for free, anywhere.
