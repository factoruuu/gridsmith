/* GridSmith — generation engine.
   Pure, DOM-free functions so the Node self-check (test.js) can verify every
   generated answer independently. Each generator returns:
   { topicId, topicLabel, diff, kind, q, options?, answer, steps[], value }
   - q: question HTML (safe: all user text is escaped before insertion)
   - answer: the correct answer as a display string
   - steps: worked step-by-step explanation lines
   - value: machine-checkable expected value used by the self-check          */
(function (global) {
  "use strict";
  var D = global.GS_DATA;

  /* ---------------- utilities ---------------- */
  function ri(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = a % b; a = b; b = t; } return a || 1; }
  function lcm(a, b) { return a * b / gcd(a, b); }
  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function fracStr(n, d) { var g = gcd(n, d); return (n / g) + "/" + (d / g); }
  function fracHTML(n, d) {
    return '<span class="frac"><sup>' + n + '</sup>&frasl;<sub>' + d + '</sub></span>';
  }
  function moneyStr(cents) {
    var sign = cents < 0 ? "-" : "";
    cents = Math.abs(cents);
    return sign + "$" + Math.floor(cents / 100) + "." + ("0" + (cents % 100)).slice(-2);
  }
  function name() { return pick(D.NAMES); }
  function itemPair() { return pick(D.ITEMS); }
  function mc(options, answerText, q, steps, extra) {
    var item = { kind: "mc", q: q, options: shuffle(options), answer: answerText, steps: steps };
    if (extra) for (var k in extra) item[k] = extra[k];
    return item;
  }
  function open(q, answerText, steps, value, extra) {
    var item = { kind: "open", q: q, answer: answerText, steps: steps, value: value };
    if (extra) for (var k2 in extra) item[k2] = extra[k2];
    return item;
  }

  /* ================= MATH — Band A (grades 1–2) + grid-mapped Band B ================= */
  var COLNAMES = ["Ones", "Tens", "Hundreds", "Thousands"];
  function noCarry(a, b) {
    while (a > 0 || b > 0) { if ((a % 10) + (b % 10) >= 10) return false; a = Math.floor(a / 10); b = Math.floor(b / 10); }
    return true;
  }
  function noBorrow(a, b) {
    while (a > 0) { if ((a % 10) < (b % 10)) return false; a = Math.floor(a / 10); b = Math.floor(b / 10); }
    return true;
  }
  function colAddSteps(a, b, ans) {
    var steps = [], carry = 0, pos = 0, x = a, y = b;
    while (x > 0 || y > 0) {
      var da = x % 10, db = y % 10, s = da + db + carry;
      var write = s % 10, nc = Math.floor(s / 10);
      var line = COLNAMES[pos] + " column: " + da + " + " + db + (carry ? " + the carried " + carry : "") + " = " + s + ".";
      line += nc ? " Write " + write + " and carry " + nc + "." : " Write " + write + ".";
      steps.push(line);
      carry = nc; x = Math.floor(x / 10); y = Math.floor(y / 10); pos++;
    }
    if (carry) steps.push("The last carried " + carry + " becomes the first digit of the answer.");
    steps.push("Answer: " + ans + ".");
    return steps;
  }
  function colSubSteps(a, b, ans) {
    var steps = [], borrow = 0, pos = 0, x = a, y = b;
    while (x > 0) {
      var raw = x % 10, db = y % 10, da = raw - borrow, d, nb = 0;
      if (da < db) { d = da + 10 - db; nb = 1; } else { d = da - db; }
      var line;
      if (borrow && nb) line = COLNAMES[pos] + " column: after lending 1, the digit is " + da + " — still smaller than " + db + ", so borrow again: " + (da + 10) + " − " + db + " = " + d + ".";
      else if (borrow) line = COLNAMES[pos] + " column: after lending 1, the digit is " + da + ": " + da + " − " + db + " = " + d + ".";
      else if (nb) line = COLNAMES[pos] + " column: " + da + " is smaller than " + db + ", so borrow 1 from the next column: " + (da + 10) + " − " + db + " = " + d + ".";
      else line = COLNAMES[pos] + " column: " + da + " − " + db + " = " + d + ".";
      steps.push(line);
      borrow = nb; x = Math.floor(x / 10); y = Math.floor(y / 10); pos++;
    }
    steps.push("Answer: " + ans + ".");
    return steps;
  }

  function genAddSub(grade, diff) {
    var max = grade === 1 ? 20 : grade === 2 ? 100 : 1000;
    var mode = pick(diff === "hard" ? ["missing", "plain", "missing"] : ["plain", "plain", "missing"]);
    var regroup = diff !== "easy";
    var a, b, steps, q, ans;
    if (mode === "missing") {
      b = ri(3, max - 3);
      ans = ri(2, max - b);
      var total = ans + b;
      q = "Fill in the missing number: <b>____ + " + b + " = " + total + "</b>";
      steps = [
        "We need a number that makes " + total + " when we add " + b + ".",
        "Use subtraction, the opposite of addition: " + total + " − " + b + " = " + ans + ".",
        "Check: " + ans + " + " + b + " = " + total + ". ✓"
      ];
      return open(q, String(ans), steps, ans);
    }
    var plus = Math.random() < 0.55;
    if (plus) {
      do { a = ri(2, max - 2); b = ri(2, max - a); }
      while (!regroup && max > 20 && !noCarry(a, b));
      ans = a + b;
      q = "What is <b>" + a + " + " + b + "</b>?";
      if (max <= 20) {
        if ((a % 10) + (b % 10) >= 10 || a + b > 10 && a < 10 && b < 10) {
          var need = 10 - a;
          if (a < 10 && b > need) {
            steps = [
              "Make a ten first: " + a + " needs " + need + " more to make 10.",
              "Take " + need + " from " + b + ": " + b + " = " + need + " + " + (b - need) + ".",
              a + " + " + need + " = 10, then 10 + " + (b - need) + " = " + ans + "."
            ];
          } else {
            steps = ["Count on from " + a + ": " + a + " → " + ans + " is " + b + " steps.", "So " + a + " + " + b + " = " + ans + "."];
          }
        } else {
          steps = ["Count on from " + a + ": " + a + " → " + ans + " is " + b + " steps.", "So " + a + " + " + b + " = " + ans + "."];
        }
      } else {
        steps = colAddSteps(a, b, ans);
      }
      return open(q, String(ans), steps, ans);
    }
    // subtraction
    do { a = ri(5, max); b = ri(2, a - 1); }
    while (!regroup && max > 20 && !noBorrow(a, b));
    ans = a - b;
    q = "What is <b>" + a + " − " + b + "</b>?";
    if (max <= 20) {
      steps = ["Count back from " + a + " by " + b + ": you land on " + ans + ".", "So " + a + " − " + b + " = " + ans + "."];
    } else {
      steps = colSubSteps(a, b, ans);
    }
    return open(q, String(ans), steps, ans);
  }

  function genCounting(grade, diff) {
    var n, rowsHtml = "", steps;
    if ((grade === 1 && diff !== "hard") || diff === "easy") {
      n = diff === "easy" ? ri(3, 10) : ri(11, 20);
      rowsHtml = '<span class="stars">' + "★".repeat(n) + "</span>";
      steps = ["Count the stars one by one, touching each star as you count.", "The last number you say is " + n + ", so there are " + n + " stars."];
    } else {
      var tens = ri(1, grade === 2 && diff === "hard" ? 4 : 3);
      var ones = ri(1, 9);
      n = tens * 10 + ones;
      for (var t = 0; t < tens; t++) rowsHtml += '<span class="stars">' + "★".repeat(10) + "</span> ";
      rowsHtml += '<span class="stars">' + "★".repeat(ones) + "</span>";
      var countByTens = [];
      for (var c = 10; c <= tens * 10; c += 10) countByTens.push(c);
      steps = [
        "Each full row has 10 stars. Count the full rows by tens: " + countByTens.join(", ") + ".",
        "Then count the extra stars in the last row: " + ones + " more.",
        tens * 10 + " + " + ones + " = " + n + " stars in all."
      ];
    }
    var q = "How many stars are there?<br>" + rowsHtml;
    return open(q, String(n), steps, n);
  }

  function genWordA(grade, diff, theme) {
    var nm = name(), it = itemPair();
    var max = grade === 1 ? 20 : 100;
    var hi = diff === "easy" ? Math.floor(max / 2) : max - 5;
    var type = pick(["join", "takeaway", "compare"]);
    var a = ri(3, hi), b, ans, q, steps;
    if (theme) {
      var ta = ri(4, hi), tb = ri(2, hi - 2);
      if (Math.random() < 0.5) {
        ans = ta + tb;
        q = esc(nm) + "'s class is studying <b>" + esc(theme) + "</b>. " + esc(nm) + " collects " + ta +
          " fact cards on Monday and " + tb + " more on Tuesday. How many fact cards does " + esc(nm) + " have now?";
        steps = ["Add the two days together: " + ta + " + " + tb + " = " + ans + ".", esc(nm) + " has " + ans + " fact cards now."];
      } else {
        if (tb >= ta) { var tmp = ta; ta = tb; tb = tmp - 1 > 0 ? tmp - ri(1, tmp - 1) : 1; if (tb >= ta) tb = ta - 1; }
        ans = ta - tb;
        q = esc(nm) + "'s class is studying <b>" + esc(theme) + "</b>. " + esc(nm) + " makes " + ta +
          " flashcards, then gives " + tb + " of them to a friend. How many flashcards does " + esc(nm) + " have left?";
        steps = ["Start with " + ta + " and take away " + tb + ": " + ta + " − " + tb + " = " + ans + ".", esc(nm) + " has " + ans + " flashcards left."];
      }
      return open(q, String(ans), steps, ans);
    }
    if (type === "join") {
      b = ri(2, hi - 2); ans = a + b;
      q = esc(nm) + " has " + a + " " + it[1] + ". " + esc(nm) + " buys " + b + " more at " + pick(D.PLACES) +
        ". How many " + it[1] + " does " + esc(nm) + " have in all?";
      steps = ["\"In all\" means add: " + a + " + " + b + " = " + ans + ".", esc(nm) + " has " + ans + " " + it[1] + " in all."];
    } else if (type === "takeaway") {
      b = ri(1, a - 1); ans = a - b;
      q = esc(nm) + " has " + a + " " + it[1] + ". " + esc(nm) + " gives " + b + " to a friend. How many " + it[1] +
        " does " + esc(nm) + " have left?";
      steps = ["Start with " + a + " and take away " + b + ": " + a + " − " + b + " = " + ans + ".", esc(nm) + " has " + ans + " " + it[1] + " left."];
    } else {
      b = ri(2, hi); if (b === a) b += 1;
      ans = Math.abs(a - b);
      var bigger = a > b ? nm : "a friend";
      var n2 = name(); while (n2 === nm) n2 = name();
      q = esc(nm) + " has " + a + " " + it[1] + " and " + esc(n2) + " has " + b + " " + it[1] +
        ". How many more " + it[1] + " does the one with more have?";
      steps = [
        "Compare the two amounts: " + Math.max(a, b) + " and " + Math.min(a, b) + ".",
        "Subtract the smaller from the larger: " + Math.max(a, b) + " − " + Math.min(a, b) + " = " + ans + ".",
        "The one with more has " + ans + " more " + it[1] + "."
      ];
    }
    return open(q, String(ans), steps, ans);
  }

  function genSequence(grade, diff) {
    var stepsOptions = grade === 1 ? [1, 2, 5, 10] : [2, 3, 5, 10, 4];
    var step = pick(diff === "easy" ? [1, 2, 10] : stepsOptions);
    if (diff === "hard" && Math.random() < 0.4) step = -step;
    var start = step > 0 ? ri(1, 15) : ri(30, 60);
    var len = 6;
    var seq = [];
    for (var i = 0; i < len; i++) seq.push(start + step * i);
    var hideCount = diff === "hard" ? 2 : 1;
    var hideIdx = shuffle([1, 2, 3, 4]).slice(0, hideCount).sort();
    var answers = hideIdx.map(function (ix) { return seq[ix]; });
    var shown = seq.map(function (v, ix) { return hideIdx.indexOf(ix) >= 0 ? "____" : v; });
    var dirWord = step > 0 ? "goes up" : "goes down";
    var stepsArr = [
      "Look at how the numbers change: " + seq[0] + " → " + seq[1] + " → " + seq[2] + ". Each number " + dirWord + " by " + Math.abs(step) + ".",
      "Keep adding " + (step > 0 ? step : "(" + step + ")") + " as you move along the row.",
      "The missing number" + (hideCount > 1 ? "s are" : " is") + ": " + answers.join(", ") + "."
    ];
    var q = "Complete the number sequence:<br><b>" + shown.join(",  ") + "</b>";
    return open(q, answers.join(", "), stepsArr, answers.join(","));
  }

  /* ================= MATH — Band B (grades 3–4) ================= */
  function genMultDiv(grade, diff) {
    var kind = pick(diff === "easy" ? ["fact", "fact", "div"] : ["fact", "big", "div", "div"]);
    var a, b, ans, q, steps;
    if (kind === "fact") {
      a = diff === "easy" ? ri(2, 5) : ri(3, 9);
      b = diff === "easy" ? ri(2, 9) : ri(3, 12);
      ans = a * b;
      q = "What is <b>" + a + " × " + b + "</b>?";
      steps = [
        a + " × " + b + " means " + a + " groups of " + b + ".",
        "Skip-count by " + b + ", " + a + " times: " + Array.from({ length: a }, function (_, i) { return b * (i + 1); }).join(", ") + ".",
        "So " + a + " × " + b + " = " + ans + "."
      ];
      return open(q, String(ans), steps, ans);
    }
    if (kind === "big") {
      a = ri(12, 49); b = ri(3, 9);
      ans = a * b;
      var tens = Math.floor(a / 10) * 10, ones = a % 10;
      q = "What is <b>" + a + " × " + b + "</b>?";
      steps = [
        "Split " + a + " into " + tens + " + " + ones + ".",
        tens + " × " + b + " = " + (tens * b) + " and " + ones + " × " + b + " = " + (ones * b) + ".",
        "Add the parts: " + (tens * b) + " + " + (ones * b) + " = " + ans + "."
      ];
      return open(q, String(ans), steps, ans);
    }
    // division
    b = diff === "easy" ? ri(2, 5) : ri(3, 9);
    var quot = diff === "easy" ? ri(2, 9) : ri(3, 12);
    if (diff === "hard" && Math.random() < 0.4) {
      var r = ri(1, b - 1);
      var dvd = b * quot + r;
      q = "What is <b>" + dvd + " ÷ " + b + "</b>? Give the answer with its remainder.";
      steps = [
        "Ask: how many " + b + "s fit in " + dvd + "? " + b + " × " + quot + " = " + (b * quot) + ", which is close but not over.",
        dvd + " − " + (b * quot) + " = " + r + " left over.",
        "So " + dvd + " ÷ " + b + " = " + quot + " remainder " + r + "."
      ];
      return open(q, quot + " r " + r, steps, quot + " r " + r);
    }
    var dividend = b * quot;
    q = "What is <b>" + dividend + " ÷ " + b + "</b>?";
    steps = [
      "Division is the opposite of multiplication. Ask: " + b + " × ? = " + dividend + ".",
      b + " × " + quot + " = " + dividend + ", so " + dividend + " ÷ " + b + " = " + quot + "."
    ];
    return open(q, String(quot), steps, quot);
  }

  function genFractionsBasic(grade, diff) {
    var type = pick(diff === "easy" ? ["identify", "identify", "compare"] : ["identify", "compare", "ofset"]);
    var n, d, i;
    if (type === "identify") {
      d = pick([2, 3, 4, 5, 6, 8]);
      n = ri(1, d - 1);
      var segs = "";
      for (i = 0; i < d; i++) segs += '<span class="seg' + (i < n ? " on" : "") + '"></span>';
      var q = 'What fraction of the bar is shaded?<br><span class="fracbar">' + segs + "</span>";
      var g = gcd(n, d);
      var steps = [
        "Count all the equal parts: there are " + d + " parts, so the denominator is " + d + ".",
        "Count the shaded parts: " + n + ", so the numerator is " + n + "."
      ];
      var ans = n + "/" + d;
      if (g > 1) {
        steps.push("Simplify: divide the top and bottom by " + g + " → " + (n / g) + "/" + (d / g) + ".");
        ans = (n / g) + "/" + (d / g);
      }
      return open(q, ans, steps, ans);
    }
    if (type === "compare") {
      var mode = pick(["sameD", "sameN", "unit"]);
      var f1, f2, bigger, steps;
      if (mode === "sameD") {
        d = pick([4, 5, 6, 8]); var x = ri(1, d - 1), y = ri(1, d - 1);
        while (y === x) y = ri(1, d - 1);
        f1 = [x, d]; f2 = [y, d]; bigger = x > y ? f1 : f2;
        steps = ["Both fractions have the same denominator (" + d + "), so compare the numerators: " + Math.max(x, y) + " is more than " + Math.min(x, y) + ".",
          "More parts of the same size means a bigger fraction."];
      } else if (mode === "sameN") {
        n = ri(2, 4); var d1 = ri(n + 1, 9), d2 = ri(n + 1, 9);
        while (d2 === d1) d2 = ri(n + 1, 9);
        f1 = [n, d1]; f2 = [n, d2]; bigger = d1 < d2 ? f1 : f2;
        steps = ["Both fractions have the same numerator (" + n + "), so the parts are shared into different numbers of pieces.",
          "Fewer pieces means each piece is bigger, so the fraction with the smaller denominator is bigger."];
      } else {
        f1 = [1, 2]; f2 = pick([[3, 4], [2, 3], [5, 8], [1, 4], [1, 3]]);
        var v1 = f1[0] / f1[1], v2 = f2[0] / f2[1];
        bigger = v1 > v2 ? f1 : f2;
        steps = ["Compare each fraction with one half. " + f1[0] + "/" + f1[1] + " is exactly one half.",
          f2[0] + "/" + f2[1] + (v2 > 0.5 ? " is more than one half, so it is the bigger one." : " is less than one half, so it is the smaller one.")];
      }
      var qq = "Which fraction is bigger: <b>" + f1[0] + "/" + f1[1] + "</b> or <b>" + f2[0] + "/" + f2[1] + "</b>?";
      var ansS = bigger[0] + "/" + bigger[1];
      steps.push("The bigger fraction is " + ansS + ".");
      return open(qq, ansS, steps, ansS);
    }
    // fraction of a set
    d = pick([2, 3, 4, 6]); n = ri(1, d - 1);
    var mult = ri(2, 6); var total = d * mult;
    var part = total / d * n;
    var it = itemPair(); var nm = name();
    var q2 = esc(nm) + " has " + total + " " + it[1] + ". <b>" + n + "/" + d + "</b> of them are red. How many " + it[1] + " are red?";
    var steps2 = [
      "First find one part: split " + total + " into " + d + " equal groups → " + total + " ÷ " + d + " = " + (total / d) + ".",
      "We need " + n + " of those parts: " + n + " × " + (total / d) + " = " + part + ".",
      part + " " + it[1] + " are red."
    ];
    return open(q2, String(part), steps2, part);
  }

  var CONVERSIONS = [
    { from: "m", to: "cm", factor: 100, label: "metres to centimetres", thing: "ribbon" },
    { from: "kg", to: "g", factor: 1000, label: "kilograms to grams", thing: "bag of rice" },
    { from: "L", to: "mL", factor: 1000, label: "litres to millilitres", thing: "bottle of juice" },
    { from: "hour", to: "minutes", factor: 60, label: "hours to minutes", thing: "bus ride" },
    { from: "week", to: "days", factor: 7, label: "weeks to days", thing: "holiday" }
  ];
  function genMeasurement(grade, diff) {
    var c = pick(CONVERSIONS);
    var type = pick(diff === "easy" ? ["convert", "convert", "word"] : ["convert", "word", "word"]);
    if (type === "convert") {
      var v = diff === "easy" ? ri(2, 9) : ri(2, 12);
      var ans = v * c.factor;
      var q = "Convert: <b>" + v + " " + c.from + " = ____ " + c.to + "</b>";
      var steps = ["1 " + c.from + " = " + c.factor + " " + c.to + ".",
        "Multiply: " + v + " × " + c.factor + " = " + ans + ".",
        "So " + v + " " + c.from + " = " + ans + " " + c.to + "."];
      return open(q, ans + " " + c.to, steps, ans);
    }
    // word problem: total of two amounts, one needs converting
    var nm = name();
    var big = ri(1, 3), small = ri(15, 90);
    var totalCm = big * c.factor + small;
    var qq = esc(nm) + " has a " + c.thing + " that measures " + big + " " + c.from + " and another that measures " +
      small + " " + c.to + ". What is their total in " + c.to + "?";
    var steps2 = ["Convert the " + c.from + " amount first: " + big + " " + c.from + " = " + (big * c.factor) + " " + c.to + ".",
      "Add the two amounts: " + (big * c.factor) + " + " + small + " = " + totalCm + " " + c.to + "."];
    return open(qq, totalCm + " " + c.to, steps2, totalCm);
  }

  var SHOP = [
    ["notebook", 350], ["juice box", 125], ["muffin", 275], ["pencil case", 475],
    ["apple pie slice", 225], ["toy ring", 150], ["water bottle", 899], ["granola bar", 95],
    ["sticker pack", 180], ["yogurt cup", 140]
  ];
  function genMoney(grade, diff) {
    var type = pick(diff === "easy" ? ["total", "change"] : ["total", "change", "coins", "multi"]);
    var s1 = pick(SHOP), s2 = pick(SHOP);
    while (s2[0] === s1[0]) s2 = pick(SHOP);
    var nm = name();
    if (type === "total") {
      var ansC = s1[1] + s2[1];
      var q = esc(nm) + " buys a " + s1[0] + " for " + moneyStr(s1[1]) + " and a " + s2[0] + " for " + moneyStr(s2[1]) +
        ". How much does " + esc(nm) + " spend in all?";
      return open(q, moneyStr(ansC), ["Add the prices: " + moneyStr(s1[1]) + " + " + moneyStr(s2[1]) + " = " + moneyStr(ansC) + "."], ansC);
    }
    if (type === "change") {
      var bill = pick([500, 1000, 2000]);
      var price = s1[1]; if (price >= bill) price = s2[1];
      var ansC2 = bill - price;
      var q2 = esc(nm) + " buys a " + s1[0] + " for " + moneyStr(price) + " and pays with " + moneyStr(bill) +
        ". How much change does " + esc(nm) + " get?";
      return open(q2, moneyStr(ansC2), ["Subtract the price from the money given: " + moneyStr(bill) + " − " + moneyStr(price) + " = " + moneyStr(ansC2) + "."], ansC2);
    }
    if (type === "coins") {
      var quarters = ri(2, 10);
      var ansC3 = quarters * 25;
      var q3 = esc(nm) + " has " + quarters + " quarters. How much money is that in cents, and in dollars?";
      return open(q3, ansC3 + " cents (" + moneyStr(ansC3) + ")", ["Each quarter is worth 25 cents.", quarters + " × 25 = " + ansC3 + " cents, which is " + moneyStr(ansC3) + "."], ansC3);
    }
    var count = ri(2, 6);
    var ansC4 = s1[1] * count;
    var q4 = "One " + s1[0] + " costs " + moneyStr(s1[1]) + ". How much do " + count + " of them cost?";
    return open(q4, moneyStr(ansC4), ["Multiply the price by the number of items: " + count + " × " + moneyStr(s1[1]) + " = " + moneyStr(ansC4) + "."], ansC4);
  }

  /* ================= MATH — Band C (grades 5–6) ================= */
  function fracAnswer(n, d) {
    var g = gcd(n, d); n /= g; d /= g;
    if (d === 1) return { str: String(n), mixed: String(n), n: n, d: d };
    if (n > d) {
      var whole = Math.floor(n / d), rem = n % d;
      return { str: n + "/" + d, mixed: whole + " " + rem + "/" + d, n: n, d: d };
    }
    return { str: n + "/" + d, mixed: n + "/" + d, n: n, d: d };
  }
  function genFractionsOps(grade, diff) {
    var op = pick(diff === "easy" ? ["addSame", "subSame"] : diff === "medium" ? ["addUnlike", "subUnlike", "multiply"] : ["addUnlike", "multiply", "divide", "wholeMul"]);
    var a, b, c, d, rn, rd, steps, q, fa;
    if (op === "addSame" || op === "subSame") {
      d = pick([4, 5, 6, 8, 10]); a = ri(1, d - 1); b = ri(1, d - 1);
      if (op === "subSame" && b >= a) { var t = a; a = b + 1; if (a >= d) { a = d - 1; b = 1; } }
      rn = op === "addSame" ? a + b : a - b; rd = d;
      fa = fracAnswer(rn, rd);
      q = "Calculate: <b>" + a + "/" + d + " " + (op === "addSame" ? "+" : "−") + " " + b + "/" + d + "</b>";
      steps = ["The denominators are the same (" + d + "), so work with the numerators only.",
        a + " " + (op === "addSame" ? "+" : "−") + " " + b + " = " + rn + ", giving " + rn + "/" + rd + ".",
        "Simplified answer: " + fa.mixed + (fa.str !== fa.mixed ? " (= " + fa.str + ")" : "") + "."];
      return open(q, fa.mixed, steps, fa.str);
    }
    if (op === "addUnlike" || op === "subUnlike") {
      var pairs = [[1, 2, 1, 4], [1, 3, 1, 6], [2, 3, 1, 6], [1, 2, 1, 3], [3, 4, 1, 8], [1, 4, 1, 6], [2, 5, 1, 10], [1, 3, 1, 4]];
      var p = pick(pairs); a = p[0]; b = p[1]; c = p[2]; d = p[3];
      if (op === "subUnlike" && a / b <= c / d) { var t2 = [a, b]; a = c; b = d; c = t2[0]; d = t2[1]; }
      var L = lcm(b, d);
      var a2 = a * (L / b), c2 = c * (L / d);
      rn = op === "addUnlike" ? a2 + c2 : a2 - c2; rd = L;
      fa = fracAnswer(rn, rd);
      q = "Calculate: <b>" + a + "/" + b + " " + (op === "addUnlike" ? "+" : "−") + " " + c + "/" + d + "</b>";
      steps = ["Find a common denominator: the least common multiple of " + b + " and " + d + " is " + L + ".",
        "Rewrite both fractions: " + a + "/" + b + " = " + a2 + "/" + L + " and " + c + "/" + d + " = " + c2 + "/" + L + ".",
        a2 + " " + (op === "addUnlike" ? "+" : "−") + " " + c2 + " = " + rn + ", giving " + rn + "/" + L + ".",
        "Simplified answer: " + fa.mixed + (fa.str !== fa.mixed ? " (= " + fa.str + ")" : "") + "."];
      return open(q, fa.mixed, steps, fa.str);
    }
    if (op === "multiply") {
      a = ri(1, 5); b = pick([2, 3, 4, 5, 6]); c = ri(1, 5); d = pick([2, 3, 4, 5, 6, 8]);
      rn = a * c; rd = b * d; fa = fracAnswer(rn, rd);
      q = "Calculate: <b>" + a + "/" + b + " × " + c + "/" + d + "</b>";
      steps = ["Multiply the numerators: " + a + " × " + c + " = " + rn + ".",
        "Multiply the denominators: " + b + " × " + d + " = " + rd + ".",
        "That gives " + rn + "/" + rd + ", which simplifies to " + fa.mixed + "."];
      return open(q, fa.mixed, steps, fa.str);
    }
    if (op === "divide") {
      a = ri(1, 5); b = pick([2, 3, 4, 6]); c = ri(1, 4); d = pick([2, 3, 4, 5]);
      rn = a * d; rd = b * c; fa = fracAnswer(rn, rd);
      q = "Calculate: <b>" + a + "/" + b + " ÷ " + c + "/" + d + "</b>";
      steps = ["Dividing by a fraction is the same as multiplying by its reciprocal: " + c + "/" + d + " flips to " + d + "/" + c + ".",
        "Now multiply: " + a + "/" + b + " × " + d + "/" + c + " = " + rn + "/" + rd + ".",
        "Simplified answer: " + fa.mixed + "."];
      return open(q, fa.mixed, steps, fa.str);
    }
    // whole number × fraction
    var w = ri(2, 6); a = ri(1, 4); b = pick([2, 3, 4, 5, 6]);
    rn = w * a; rd = b; fa = fracAnswer(rn, rd);
    q = "Calculate: <b>" + w + " × " + a + "/" + b + "</b>";
    steps = ["Multiply the whole number by the numerator: " + w + " × " + a + " = " + rn + ".",
      "Keep the denominator: " + rn + "/" + rd + ".",
      "Simplified answer: " + fa.mixed + "."];
    return open(q, fa.mixed, steps, fa.str);
  }

  function genDecimalsPercent(grade, diff) {
    var type = pick(diff === "easy" ? ["decAdd", "shift", "fracPct"] : ["decAdd", "decSub", "pctOf", "fracPct"]);
    if (type === "decAdd" || type === "decSub") {
      var x = ri(150, 4999), y = ri(110, 3999); // hundredths
      if (type === "decSub" && y > x) { var t = x; x = y; y = t; }
      var ans = type === "decAdd" ? x + y : x - y;
      var xs = (x / 100).toFixed(2), ys = (y / 100).toFixed(2), as = (ans / 100).toFixed(2);
      var q = "Calculate: <b>" + xs + " " + (type === "decAdd" ? "+" : "−") + " " + ys + "</b>";
      var steps = ["Line up the decimal points so tenths are under tenths and hundredths under hundredths.",
        "Work column by column: " + xs + " " + (type === "decAdd" ? "+" : "−") + " " + ys + " = " + as + ".",
        "Keep the decimal point in the same column in the answer."];
      return open(q, as, steps, ans / 100);
    }
    if (type === "shift") {
      var base = ri(12, 999), mult = pick([10, 100]);
      var shown = (base / 10).toFixed(1);           // e.g. base 370 -> "37.0"
      var val = mult === 10 ? base : base * 10;      // integer-exact result
      var q2 = "Calculate: <b>" + shown + " × " + mult + "</b>";
      var steps2 = ["Multiplying by " + mult + " moves the decimal point " + (mult === 10 ? "1 place" : "2 places") + " to the right.",
        shown + " × " + mult + " = " + val + "."];
      return open(q2, String(val), steps2, val);
    }
    if (type === "pctOf") {
      var p = pick([10, 20, 25, 50, 75]);
      var unit, baseN;
      if (p === 10) { baseN = ri(3, 24) * 10; unit = baseN / 10; }
      else if (p === 20) { baseN = ri(3, 16) * 5; unit = baseN / 5; }
      else if (p === 50) { baseN = ri(4, 30) * 2; unit = baseN / 2; }
      else { baseN = ri(3, 15) * 4; unit = baseN / 4; }
      var ans3 = p === 75 ? unit * 3 : unit;
      var q3 = "What is <b>" + p + "% of " + baseN + "</b>?";
      var steps3;
      if (p === 10) steps3 = ["10% means one tenth. Divide by 10: " + baseN + " ÷ 10 = " + ans3 + "."];
      else if (p === 20) steps3 = ["20% is one fifth. Divide by 5: " + baseN + " ÷ 5 = " + ans3 + "."];
      else if (p === 50) steps3 = ["50% means one half. Divide by 2: " + baseN + " ÷ 2 = " + ans3 + "."];
      else if (p === 25) steps3 = ["25% means one quarter. Divide by 4: " + baseN + " ÷ 4 = " + ans3 + "."];
      else steps3 = ["75% is three quarters. One quarter of " + baseN + " is " + baseN + " ÷ 4 = " + unit + ".", "Three quarters: 3 × " + unit + " = " + ans3 + "."];
      return open(q3, String(ans3), steps3, ans3);
    }
    var fp = pick([[1, 2, 50], [1, 4, 25], [3, 4, 75], [1, 5, 20], [2, 5, 40], [1, 10, 10], [3, 5, 60], [4, 5, 80]]);
    var q4 = "Write <b>" + fp[0] + "/" + fp[1] + "</b> as a percent.";
    var steps4 = ["Percent means \"out of 100\". Scale the fraction so the denominator becomes 100: " +
      fp[0] + "/" + fp[1] + " = " + fp[2] + "/100.", "So " + fp[0] + "/" + fp[1] + " = " + fp[2] + "%."];
    return open(q4, fp[2] + "%", steps4, fp[2]);
  }

  function genRatio(grade, diff) {
    var type = pick(["simplify", "scale", "total"]);
    var a = ri(2, 9), b = ri(2, 9);
    if (type === "simplify") {
      var g = pick([2, 3, 4, 5]);
      var A = a * g, B = b * g;
      if (gcd(a, b) !== 1) { a = 3; b = 5; A = a * g; B = b * g; }
      var q = "Simplify the ratio <b>" + A + " : " + B + "</b> to its lowest terms.";
      var steps = ["Find the greatest common factor of " + A + " and " + B + ": it is " + (g * gcd(a, b)) + ".",
        "Divide both sides by " + (g * gcd(a, b)) + ": " + A + " ÷ " + (g * gcd(a, b)) + " = " + (A / (g * gcd(a, b))) +
        " and " + B + " ÷ " + (g * gcd(a, b)) + " = " + (B / (g * gcd(a, b))) + ".",
        "Simplest form: " + (A / (g * gcd(a, b))) + " : " + (B / (g * gcd(a, b))) + "."];
      var ansS = (A / (g * gcd(a, b))) + ":" + (B / (g * gcd(a, b)));
      return open(q, ansS, steps, ansS);
    }
    var nm = name();
    if (type === "scale") {
      while (gcd(a, b) !== 1) { a = ri(2, 8); b = ri(2, 9); }
      var k = ri(2, 6);
      var givenA = a * k, ansB = b * k;
      var q2 = "In a class display, the ratio of drawings to photos is <b>" + a + " : " + b + "</b>. If there are " +
        givenA + " drawings, how many photos are there?";
      var steps2 = [a + " parts stand for " + givenA + " drawings, so one part is " + givenA + " ÷ " + a + " = " + k + ".",
        "Photos are " + b + " parts: " + b + " × " + k + " = " + ansB + "."];
      return open(q2, String(ansB), steps2, ansB);
    }
    while (gcd(a, b) !== 1) { a = ri(2, 8); b = ri(2, 9); }
    var parts = a + b, per = ri(2, 7), total = parts * per;
    var ansA = a * per;
    var q3 = "A ribbon is cut into two pieces in the ratio <b>" + a + " : " + b + "</b>. The whole ribbon is " + total +
      " cm long. How long is the first piece?";
    var steps3 = ["Add the parts: " + a + " + " + b + " = " + parts + " parts.",
      "Each part is " + total + " ÷ " + parts + " = " + per + " cm.",
      "The first piece has " + a + " parts: " + a + " × " + per + " = " + ansA + " cm."];
    return open(q3, ansA + " cm", steps3, ansA);
  }

  function genGeometry(grade, diff) {
    var type = pick(diff === "easy" ? ["rectP", "rectA", "square"] : ["rectA", "rectP", "triangle", "square"]);
    var L = ri(3, 15), W = ri(2, 12);
    if (type === "rectP") {
      var p = 2 * (L + W);
      return open("A rectangle is <b>" + L + " cm</b> long and <b>" + W + " cm</b> wide. What is its perimeter?",
        p + " cm", ["Perimeter means the distance all the way around: add all four sides.",
          L + " + " + W + " + " + L + " + " + W + " = " + p + " cm."], p);
    }
    if (type === "rectA") {
      var ar = L * W;
      return open("A garden bed is <b>" + L + " m</b> long and <b>" + W + " m</b> wide. What is its area?",
        ar + " m²", ["Area of a rectangle = length × width.", L + " × " + W + " = " + ar + " square metres (m²)."], ar);
    }
    if (type === "square") {
      var s = ri(3, 14), sq = s * s;
      return open("A square tile has sides of <b>" + s + " cm</b>. What is the area of the tile?",
        sq + " cm²", ["Area of a square = side × side.", s + " × " + s + " = " + sq + " cm²."], sq);
    }
    var base = ri(4, 16), h = ri(3, 12);
    if ((base * h) % 2 !== 0) base += 1;
    var ta = base * h / 2;
    return open("A triangle has a base of <b>" + base + " cm</b> and a height of <b>" + h + " cm</b>. What is its area?",
      ta + " cm²", ["Area of a triangle = (base × height) ÷ 2.", "(" + base + " × " + h + ") ÷ 2 = " + (base * h) + " ÷ 2 = " + ta + " cm²."], ta);
  }

  function genMultistep(grade, diff, theme) {
    var nm = name();
    var type = pick(["buyChange", "boxesLeft", "shareTotal", "pages"]);
    var steps, q, ans;
    if (theme) {
      var secs = ri(3, 8), per2 = ri(3, 9), intro = ri(2, 6);
      ans = secs * per2 + intro;
      q = esc(nm) + " is writing a report about <b>" + esc(theme) + "</b>. The report has " + secs +
        " sections with " + per2 + " paragraphs each, plus an introduction of " + intro +
        " paragraphs. How many paragraphs does the report have in all?";
      steps = ["Step 1 — paragraphs in the sections: " + secs + " × " + per2 + " = " + (secs * per2) + ".",
        "Step 2 — add the introduction: " + (secs * per2) + " + " + intro + " = " + ans + "."];
      return open(q, String(ans), steps, ans);
    }
    if (type === "buyChange") {
      var cnt = ri(2, 6), price = pick([150, 225, 275, 350, 475]);
      var cost = cnt * price, bill = pick([1000, 2000]);
      while (cost >= bill) { cnt = 2; cost = cnt * price; }
      ans = bill - cost;
      var it = pick(SHOP)[0];
      q = esc(nm) + " buys " + cnt + " " + (cnt > 1 ? "notebooks" : "notebook") + " at " + moneyStr(price) +
        " each and pays with " + moneyStr(bill) + ". How much change does " + esc(nm) + " receive?";
      steps = ["Step 1 — total cost: " + cnt + " × " + moneyStr(price) + " = " + moneyStr(cost) + ".",
        "Step 2 — change: " + moneyStr(bill) + " − " + moneyStr(cost) + " = " + moneyStr(ans) + "."];
      return open(q, moneyStr(ans), steps, ans);
    }
    if (type === "boxesLeft") {
      var boxes = ri(3, 9), per = ri(4, 12), give = ri(3, 20);
      var total = boxes * per; ans = total - give;
      var it2 = itemPair();
      q = "A shop packs " + boxes + " boxes with " + per + " " + it2[1] + " in each box. Then " + give +
        " " + it2[1] + " are sold. How many " + it2[1] + " are left?";
      steps = ["Step 1 — total packed: " + boxes + " × " + per + " = " + total + ".",
        "Step 2 — subtract the ones sold: " + total + " − " + give + " = " + ans + "."];
      return open(q, String(ans), steps, ans);
    }
    if (type === "shareTotal") {
      var friends = pick([3, 4, 5, 6]);
      var per3 = ri(4, 12), extra = friends * ri(1, 4);
      var tot = friends * per3 + extra; ans = per3 + extra / friends;
      var it3 = itemPair();
      q = nm + " and friends collect " + tot + " " + it3[1] + ". They share them equally among " + friends +
        " children. How many " + it3[1] + " does each child get?";
      steps = ["Divide the total by the number of children: " + tot + " ÷ " + friends + " = " + ans + ".",
        "Check: " + friends + " × " + ans + " = " + tot + ". ✓"];
      return open(q, String(ans), steps, ans);
    }
    var days = ri(3, 7), ppd = ri(6, 15), extraP = ri(5, 20);
    ans = days * ppd + extraP;
    q = esc(nm) + " reads " + ppd + " pages every day for " + days + " days, then reads " + extraP +
      " more pages on the weekend. How many pages has " + esc(nm) + " read in all?";
    steps = ["Step 1 — pages on the weekdays: " + days + " × " + ppd + " = " + (days * ppd) + ".",
      "Step 2 — add the weekend pages: " + (days * ppd) + " + " + extraP + " = " + ans + "."];
    return open(q, String(ans), steps, ans);
  }

  /* ================= ENGLISH ================= */
  function genVocab(band) {
    var bank = D.VOCAB[band];
    var entry = pick(bank);
    if (Math.random() < 0.35) {
      // "Choose the meaning" form — doubles the unique-item pool of the bank.
      var others2 = shuffle(bank.filter(function (e) { return e.w !== entry.w; })).slice(0, 2);
      var opts2 = [entry.def].concat(others2.map(function (e) { return e.def; }));
      var q2 = "What does the word <b>\"" + entry.w + "\"</b> mean?";
      var steps2 = ["\"" + entry.w.charAt(0).toUpperCase() + entry.w.slice(1) + "\" means " + entry.def + ".",
        "Example: " + entry.s.replace("___", entry.w)];
      return mc(opts2, entry.def, q2, steps2, { value: entry.def });
    }
    var others = shuffle(bank.filter(function (e) { return e.cat !== entry.cat; })).slice(0, 2);
    var options = [entry.w].concat(others.map(function (e) { return e.w; }));
    var q = "Choose the word that best completes the sentence.<br><i>\"" + entry.s + "\"</i>";
    var steps = ["\"" + entry.w.charAt(0).toUpperCase() + entry.w.slice(1) + "\" means " + entry.def + ".",
      "That meaning fits the sentence, so the missing word is \"" + entry.w + "\"."];
    return mc(options, entry.w, q, steps, { value: entry.w });
  }

  function genChoose(band) {
    var entry = pick(D.CHOOSE[band]);
    var q = "Choose the correct word to complete the sentence.<br><i>\"" + entry.s + "\"</i>";
    return mc(entry.options.slice(), entry.answer, q, [entry.why], { value: entry.answer });
  }

  function genGrammarA(diff) {
    var type = pick(["isare", "aan", "hashave"]);
    if (type === "isare") {
      var singular = ["The cat", "The dog", "My teacher", "She", "He", "It", "The bird", "Mr. Lee"];
      var plural = ["The dogs", "My friends", "They", "We", "The birds", "Tom and Ana", "The children"];
      var frames = ["___ happy today.", "___ playing in the garden.", "___ ready for lunch.", "___ very kind."];
      var isSing = Math.random() < 0.5;
      var subj = isSing ? pick(singular) : pick(plural);
      var ans = isSing ? "is" : "are";
      var q = "Choose the correct word.<br><i>\"" + subj + " ___ " + pick(frames).slice(4) + "\"</i>";
      var steps = ["The subject \"" + subj + "\" is " + (isSing ? "one person or thing" : "more than one") +
        ", so we use \"" + ans + "\"."];
      return mc(["is", "are"], ans, q, steps, { value: ans });
    }
    if (type === "aan") {
      var vowel = ["apple", "orange", "egg", "umbrella", "elephant", "ant", "ice cube", "octopus"];
      var cons = ["dog", "cat", "banana", "book", "pencil", "house", "cake", "fish"];
      var isV = Math.random() < 0.5;
      var noun = isV ? pick(vowel) : pick(cons);
      var ans2 = isV ? "an" : "a";
      var q2 = "Choose the correct word.<br><i>\"I can see ___ " + noun + ".\"</i>";
      var steps2 = ["\"" + noun.charAt(0).toUpperCase() + noun.slice(1) + "\" begins with a " +
        (isV ? "vowel sound" : "consonant sound") + ", so we use \"" + ans2 + "\" before it."];
      return mc(["a", "an"], ans2, q2, steps2, { value: ans2 });
    }
    var singS = ["He", "She", "It", "My sister", "The baby"];
    var plurS = ["I", "You", "We", "They", "My friends"];
    var isS = Math.random() < 0.5;
    var subj2 = isS ? pick(singS) : pick(plurS);
    var ans3 = isS ? "has" : "have";
    var q3 = "Choose the correct word.<br><i>\"" + subj2 + " ___ a new bicycle.\"</i>";
    var steps3 = ["\"" + subj2 + "\" goes with \"" + ans3 + "\" in this sentence."];
    return mc(["has", "have"], ans3, q3, steps3, { value: ans3 });
  }

  var PRONOUN_ITEMS = [
    { s: "___ am a student in Grade 4.", options: ["I", "He", "She"], answer: "I", why: "\"I\" is used when the speaker talks about himself or herself." },
    { s: "Maria is kind. ___ helps everyone.", options: ["He", "She", "It"], answer: "She", why: "Maria is a girl, so we use \"she\"." },
    { s: "The book is on the table. ___ is blue.", options: ["He", "She", "It"], answer: "It", why: "A book is a thing, so we use \"it\"." },
    { s: "Tom and I are friends. ___ play together.", options: ["We", "They", "He"], answer: "We", why: "\"Tom and I\" together means \"we\"." },
    { s: "Mr. Rao is our teacher. ___ teaches maths.", options: ["She", "He", "It"], answer: "He", why: "Mr. Rao is a man, so we use \"he\"." },
    { s: "The children are outside. ___ are playing.", options: ["We", "They", "She"], answer: "They", why: "\"The children\" is more than one person, so we use \"they\"." }
  ];
  function genGrammarB(diff) {
    var type = pick(["past", "waswere", "pronoun"]);
    if (type === "past") {
      var sc = pick(D.VERB_SCENES);
      var nm = name();
      var sentence = sc.s.replace("{name}", nm);
      var distract = sc.v[0] === "read" ? "reads" : sc.v[0] + "s";
      var q = "Choose the correct past-tense word.<br><i>\"" + sentence + "\"</i>";
      var steps = ["The sentence talks about the past (it says \"yesterday / last …\"), so we need the past form.",
        "The past form of \"" + sc.v[0] + "\" is \"" + sc.v[1] + "\"."];
      return mc([sc.v[1], sc.v[0], distract], sc.v[1], q, steps, { value: sc.v[1] });
    }
    if (type === "waswere") {
      var sing = ["The cat", "She", "He", "It", "My brother"];
      var plur = ["The children", "They", "We", "My parents"];
      var isS = Math.random() < 0.5;
      var subj = isS ? pick(sing) : pick(plur);
      var ans = isS ? "was" : "were";
      var q2 = "Choose the correct word.<br><i>\"" + subj + " ___ at home yesterday.\"</i>";
      var steps2 = ["\"" + subj + "\" is " + (isS ? "one person or thing" : "more than one") +
        ", and the sentence is about the past, so we use \"" + ans + "\"."];
      return mc(["was", "were"], ans, q2, steps2, { value: ans });
    }
    var p = pick(PRONOUN_ITEMS);
    var q3 = "Choose the correct pronoun.<br><i>\"" + p.s + "\"</i>";
    return mc(p.options.slice(), p.answer, q3, [p.why], { value: p.answer });
  }

  var AGREEMENT = [
    { subj: "The team", v: ["plays", "play"], frame: "football every Sunday." },
    { subj: "The players", v: ["play", "plays"], frame: "football every Sunday." },
    { subj: "My sister", v: ["writes", "write"], frame: "stories in her notebook." },
    { subj: "The birds", v: ["sing", "sings"], frame: "at sunrise." },
    { subj: "The sun", v: ["shines", "shine"], frame: "brightly at noon." },
    { subj: "The students", v: ["study", "studies"], frame: "in the library after school." }
  ];
  var COMPARATIVES = [
    { s: "An elephant is ___ than a mouse.", options: ["bigger", "biggest"], answer: "bigger", why: "The word \"than\" shows we are comparing two things, so we use the comparative form \"bigger\"." },
    { s: "Of all the students, Dina is the ___ runner.", options: ["faster", "fastest"], answer: "fastest", why: "\"Of all\" shows we are comparing one with a whole group, so we use the superlative \"fastest\"." },
    { s: "Today is ___ than yesterday.", options: ["colder", "coldest"], answer: "colder", why: "\"Than\" signals a comparison between two days, so use \"colder\"." },
    { s: "This is the ___ book on the shelf.", options: ["longer", "longest"], answer: "longest", why: "\"The\" plus comparing with everything on the shelf needs the superlative \"longest\"." },
    { s: "A bicycle is ___ than a car in traffic.", options: ["quicker", "quickest"], answer: "quicker", why: "Two things are compared with \"than\", so the comparative \"quicker\" is correct." },
    { s: "He is the ___ boy in his class.", options: ["taller", "tallest"], answer: "tallest", why: "He is compared with the whole class, so we use the superlative \"tallest\"." }
  ];
  function genGrammarC(diff) {
    var type = pick(["agreement", "past", "comparative"]);
    if (type === "agreement") {
      var ag = pick(AGREEMENT);
      var ans = ag.v[0];
      var q = "Choose the correct verb form.<br><i>\"" + ag.subj + " ___ " + ag.frame + "\"</i>";
      var steps = ["The subject \"" + ag.subj + "\" needs the verb form \"" + ans + "\" in this sentence."];
      return mc(ag.v.slice(), ans, q, steps, { value: ans });
    }
    if (type === "past") return genGrammarB("medium");
    var cp = pick(COMPARATIVES);
    var q3 = "Choose the correct word.<br><i>\"" + cp.s + "\"</i>";
    return mc(cp.options.slice(), cp.answer, q3, [cp.why], { value: cp.answer });
  }

  function genReading(grade, usedIds) {
    var band = D.bandOf(grade);
    var wantLevel = band === "A" ? 1 : band === "B" ? 2 : 3;
    var fits = D.PASSAGES.filter(function (p) {
      return grade >= p.minGrade && grade <= p.maxGrade && usedIds.indexOf(p.id) < 0;
    });
    if (!fits.length) return null;
    fits.sort(function (x, y) { return Math.abs(x.level - wantLevel) - Math.abs(y.level - wantLevel); });
    var pool = fits.filter(function (p) { return Math.abs(p.level - wantLevel) === Math.abs(fits[0].level - wantLevel); });
    var p = pick(pool);
    var items = p.qs.map(function (qq, i) {
      var item = mc(qq.options.slice(), qq.options[qq.answer],
        esc(qq.q), [qq.why], { value: qq.options[qq.answer] });
      item.kind = "reading";
      item.group = p.id;
      if (i === 0) { item.passageTitle = p.title; item.passageText = p.text; }
      return item;
    });
    return { passage: p, items: items };
  }

  /* Themed word problem for unmatched kisi-kisi lines (Band B) */
  function genThemedWordB(grade, diff, theme) {
    var nm = name();
    var rows = ri(3, 8), per = ri(3, 9);
    var ans = rows * per;
    var q = esc(nm) + "'s class is making a poster about <b>" + esc(theme) + "</b>. They arrange " + rows +
      " rows of photos with " + per + " photos in each row. How many photos are on the poster?";
    var steps = ["Multiply the rows by the photos in each row: " + rows + " × " + per + " = " + ans + "."];
    return open(q, String(ans), steps, ans);
  }

  /* ================= generator dispatch ================= */
  var GENERATORS = {
    addsub: function (g, d) { return genAddSub(g, d); },
    counting: function (g, d) { return genCounting(g, d); },
    word: function (g, d, ctx) { return genWordA(g, d, ctx && ctx.theme); },
    sequence: function (g, d) { return genSequence(g, d); },
    multdiv: function (g, d) { return genMultDiv(g, d); },
    fractionsBasic: function (g, d) { return genFractionsBasic(g, d); },
    measurement: function (g, d) { return genMeasurement(g, d); },
    money: function (g, d) { return genMoney(g, d); },
    fractionsOps: function (g, d) { return genFractionsOps(g, d); },
    decimalsPercent: function (g, d) { return genDecimalsPercent(g, d); },
    ratio: function (g, d) { return genRatio(g, d); },
    geometry: function (g, d) { return genGeometry(g, d); },
    multistep: function (g, d, ctx) { return genMultistep(g, d, ctx && ctx.theme); },
    vocab: function (g, d) { return genVocab(D.bandOf(g)); },
    choose: function (g, d) { return genChoose(D.bandOf(g)); },
    grammar: function (g, d) {
      var b = D.bandOf(g);
      return b === "A" ? genGrammarA(d) : b === "B" ? genGrammarB(d) : genGrammarC(d);
    }
  };
  var TOPIC_LABEL = {};
  ["math", "english"].forEach(function (s) {
    ["A", "B", "C"].forEach(function (b) {
      D.TOPICS[s][b].forEach(function (t) { TOPIC_LABEL[t.id] = t.label; });
    });
  });

  function topicsFor(grade, subject) {
    var band = D.bandOf(grade);
    return D.TOPICS[subject][band].filter(function (t) {
      return !t.minGrade || grade >= t.minGrade;
    });
  }

  /* ================= kisi-kisi parsing ================= */
  function parseGrid(text, grade, subject) {
    var band = D.bandOf(grade);
    var valid = {};
    topicsFor(grade, subject).forEach(function (t) { valid[t.id] = true; });
    // Topics reachable only through the grid (e.g. add/sub for grades 3-4) are valid too.
    D.GRID_KEYWORDS.forEach(function (entry) {
      if (entry.subject && entry.subject !== subject) return;
      (entry.topics[band] || []).forEach(function (tid) { valid[tid] = true; });
    });
    var topicIds = [], themes = [], mapping = [];
    var lines = String(text || "").split(/\r?\n/).map(function (l) { return l.trim(); }).filter(Boolean);
    lines.forEach(function (line) {
      var clean = line.replace(/^[-*•\d.)\s]+/, "").trim();
      var low = clean.toLowerCase();
      var matched = [];
      D.GRID_KEYWORDS.forEach(function (entry) {
        if (entry.subject && entry.subject !== subject) return;
        for (var i = 0; i < entry.keys.length; i++) {
          if (low.indexOf(entry.keys[i]) >= 0) {
            (entry.topics[band] || []).forEach(function (tid) {
              if (valid[tid] && matched.indexOf(tid) < 0) matched.push(tid);
            });
            break;
          }
        }
      });
      if (matched.length) {
        matched.forEach(function (tid) { if (topicIds.indexOf(tid) < 0) topicIds.push(tid); });
        mapping.push({ line: clean, matched: matched.map(function (t) { return TOPIC_LABEL[t]; }), theme: false });
      } else if (clean.length >= 3) {
        themes.push(clean);
        mapping.push({ line: clean, matched: [], theme: true });
      }
    });
    return { topicIds: topicIds, themes: themes, mapping: mapping };
  }

  /* ================= set builder ================= */
  function difficultyCounts(total, w) {
    var sum = w.easy + w.medium + w.hard;
    if (sum === 0) { w = { easy: 1, medium: 1, hard: 1 }; sum = 3; }
    var raw = [
      { k: "easy", v: total * w.easy / sum },
      { k: "medium", v: total * w.medium / sum },
      { k: "hard", v: total * w.hard / sum }
    ];
    var counts = { easy: 0, medium: 0, hard: 0 };
    raw.forEach(function (r) { counts[r.k] = Math.floor(r.v); });
    var left = total - counts.easy - counts.medium - counts.hard;
    raw.sort(function (x, y) { return (y.v - Math.floor(y.v)) - (x.v - Math.floor(x.v)); });
    for (var i = 0; i < left; i++) counts[raw[i % 3].k]++;
    return counts;
  }

  function buildSet(opts) {
    var grade = opts.grade, subject = opts.subject, total = opts.total;
    var topicIds = (opts.topicIds || []).slice();
    var themes = (opts.themes || []).slice();
    var counts = difficultyCounts(total, opts.weights || { easy: 4, medium: 4, hard: 2 });
    if (!topicIds.length) topicIds = topicsFor(grade, subject).map(function (t) { return t.id; });
    var items = [], seen = {}, usedPassages = [];

    function tryAdd(item, diff) {
      if (!item) return false;
      var key = item.q.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim().toLowerCase();
      if (seen[key]) return false;
      seen[key] = true;
      item.diff = diff;
      item.topicLabel = TOPIC_LABEL[item.topicId] || item.topicLabel || "";
      items.push(item);
      return true;
    }

    // Reading blocks first (they consume 3 slots from one difficulty bucket)
    var readingDiff = null;
    if (subject === "english" && topicIds.indexOf("reading") >= 0) {
      var order = ["medium", "easy", "hard"];
      for (var oi = 0; oi < order.length; oi++) {
        if (counts[order[oi]] >= 3) { readingDiff = order[oi]; break; }
      }
      if (readingDiff) {
        var rd = genReading(grade, usedPassages);
        if (rd) {
          usedPassages.push(rd.passage.id);
          rd.items.forEach(function (it) {
            it.topicId = "reading";
            tryAdd(it, readingDiff);
          });
          counts[readingDiff] -= rd.items.length;
        }
      }
    }

    var plainTopics = topicIds.filter(function (t) { return t !== "reading"; });
    ["easy", "medium", "hard"].forEach(function (diff) {
      var need = counts[diff];
      var attempts = 0, ti = 0;
      while (need > 0 && attempts < need * 30 + 30) {
        attempts++;
        var tid = plainTopics[ti % plainTopics.length]; ti++;
        var ctx = {};
        // Feed kisi-kisi themes into word-problem generators
        if (themes.length && (tid === "word" || tid === "multistep")) ctx.theme = themes[(ti - 1) % themes.length];
        var item = GENERATORS[tid](grade, diff, ctx);
        item.topicId = tid;
        if (tryAdd(item, diff)) need--;
      }
      // Themed fallback items for Band B maths (no native word topic)
      if (subject === "math" && D.bandOf(grade) === "B" && themes.length) {
        var tNeed = Math.min(need, themes.length);
        for (var k = 0; k < tNeed; k++) {
          var tw = genThemedWordB(grade, diff, themes[k % themes.length]);
          tw.topicId = plainTopics[0];
          if (tryAdd(tw, diff)) need--;
        }
      }
      counts[diff] = need;
    });

    // If themed lines exist for English but produced nothing extra, they are
    // surfaced in the mapping panel by the UI (reading match happens in parse).
    return { items: items.slice(0, total), countsPlanned: counts };
  }

  global.GS_ENGINE = {
    ri: ri, pick: pick, shuffle: shuffle, gcd: gcd, lcm: lcm, esc: esc,
    moneyStr: moneyStr, fracStr: fracStr,
    GENERATORS: GENERATORS, topicsFor: topicsFor, parseGrid: parseGrid,
    buildSet: buildSet, difficultyCounts: difficultyCounts,
    genReading: genReading, TOPIC_LABEL: TOPIC_LABEL
  };
})(typeof window !== "undefined" ? window : globalThis);
