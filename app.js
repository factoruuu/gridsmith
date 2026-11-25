/* GridSmith — UI wiring. All generation lives in engine.js; this file only
   reads controls, renders the worksheet + answer key, and handles print. */
(function () {
  "use strict";
  var E = window.GS_ENGINE;
  var D = window.GS_DATA;

  var state = {
    grade: 4,
    subject: "math",
    total: 10,
    lastItems: null,
    lastMeta: null
  };

  var $ = function (id) { return document.getElementById(id); };
  var gradeSeg = $("gradeSeg"), countSeg = $("countSeg"), topicChips = $("topicChips");

  /* ---------- segmented controls ---------- */
  function buildSegments() {
    gradeSeg.innerHTML = "";
    for (var g = 1; g <= 6; g++) {
      var b = document.createElement("button");
      b.type = "button"; b.textContent = "Grade " + g; b.dataset.value = g;
      b.setAttribute("role", "radio");
      if (g === state.grade) b.classList.add("active");
      b.addEventListener("click", function () {
        state.grade = Number(this.dataset.value);
        markActive(gradeSeg, this);
        renderTopics();
        updateMix();
      });
      gradeSeg.appendChild(b);
    }
    countSeg.innerHTML = "";
    [5, 10, 15, 20].forEach(function (n) {
      var b = document.createElement("button");
      b.type = "button"; b.textContent = n; b.dataset.value = n;
      b.setAttribute("role", "radio");
      if (n === state.total) b.classList.add("active");
      b.addEventListener("click", function () {
        state.total = Number(this.dataset.value);
        markActive(countSeg, this);
        updateMix();
      });
      countSeg.appendChild(b);
    });
  }
  function markActive(container, btn) {
    Array.prototype.forEach.call(container.children, function (c) { c.classList.remove("active"); });
    btn.classList.add("active");
  }

  /* ---------- subject ---------- */
  Array.prototype.forEach.call(document.querySelectorAll(".subject-card"), function (card) {
    card.addEventListener("click", function () {
      state.subject = this.dataset.subject;
      Array.prototype.forEach.call(document.querySelectorAll(".subject-card"), function (c) { c.classList.remove("active"); });
      this.classList.add("active");
      renderTopics();
    });
  });

  /* ---------- topics ---------- */
  function renderTopics() {
    var topics = E.topicsFor(state.grade, state.subject);
    topicChips.innerHTML = "";
    topics.forEach(function (t) {
      var label = document.createElement("label");
      label.className = "topic-chip";
      label.title = t.desc;
      var cb = document.createElement("input");
      cb.type = "checkbox"; cb.checked = true; cb.value = t.id;
      label.appendChild(cb);
      label.appendChild(document.createTextNode(t.label));
      topicChips.appendChild(label);
    });
  }
  function checkedTopics() {
    return Array.prototype.map.call(topicChips.querySelectorAll("input:checked"), function (i) { return i.value; });
  }

  /* ---------- difficulty mix ---------- */
  var sliders = { easy: $("wEasy"), medium: $("wMedium"), hard: $("wHard") };
  function weights() {
    return { easy: Number(sliders.easy.value), medium: Number(sliders.medium.value), hard: Number(sliders.hard.value) };
  }
  function updateMix() {
    var counts = E.difficultyCounts(state.total, weights());
    $("wEasyOut").textContent = counts.easy + " of " + state.total;
    $("wMediumOut").textContent = counts.medium + " of " + state.total;
    $("wHardOut").textContent = counts.hard + " of " + state.total;
    var pct = function (n) { return state.total ? (n / state.total * 100) : 0; };
    $("mixEasy").style.width = pct(counts.easy) + "%";
    $("mixMedium").style.width = pct(counts.medium) + "%";
    $("mixHard").style.width = pct(counts.hard) + "%";
    return counts;
  }
  ["easy", "medium", "hard"].forEach(function (k) {
    sliders[k].addEventListener("input", updateMix);
  });

  /* ---------- generation ---------- */
  function gatherSettings() {
    var gridText = $("gridText").value.trim();
    var parsed = gridText ? E.parseGrid(gridText, state.grade, state.subject) : null;
    var topicIds, themes = [], mapping = null;
    if (parsed && parsed.topicIds.length) {
      topicIds = parsed.topicIds;
      themes = parsed.themes;
      mapping = parsed.mapping;
    } else {
      topicIds = checkedTopics();
      if (parsed) { themes = parsed.themes; mapping = parsed.mapping; }
    }
    if (!topicIds.length) topicIds = checkedTopics();
    return { topicIds: topicIds, themes: themes, mapping: mapping };
  }

  function generate() {
    var s = gatherSettings();
    var res = E.buildSet({
      grade: state.grade, subject: state.subject, total: state.total,
      weights: weights(), topicIds: s.topicIds, themes: s.themes
    });
    state.lastItems = res.items;
    state.lastMeta = {
      grade: state.grade, subject: state.subject,
      topics: s.topicIds.map(function (t) { return E.TOPIC_LABEL[t]; }),
      mapping: s.mapping,
      counts: tally(res.items)
    };
    render();
    $("btnRegen").disabled = false;
    $("btnPrint").disabled = false;
  }

  function tally(items) {
    var c = { easy: 0, medium: 0, hard: 0 };
    items.forEach(function (i) { c[i.diff]++; });
    return c;
  }

  /* ---------- rendering ---------- */
  function subjectLabel() { return state.subject === "math" ? "Mathematics" : "English Language"; }

  function render() {
    var items = state.lastItems, meta = state.lastMeta;
    $("emptyState").hidden = true;
    $("resultWrap").hidden = false;

    var mixText = meta.counts.easy + " easy · " + meta.counts.medium + " medium · " + meta.counts.hard + " hard";
    $("resultMeta").textContent = "Grade " + meta.grade + " · " + subjectLabel() + " · " + items.length + " questions · " + mixText;

    // mapping panel
    var mp = $("mappingPanel");
    if (meta.mapping && meta.mapping.length) {
      mp.hidden = false;
      var rows = meta.mapping.map(function (m) {
        if (m.theme) return "<li><b>" + E.esc(m.line) + "</b> → used as a word-problem theme</li>";
        return "<li><b>" + E.esc(m.line) + "</b> → " + m.matched.map(E.esc).join(", ") + "</li>";
      }).join("");
      mp.innerHTML = "<h3>How your curriculum grid was read</h3><ul>" + rows + "</ul>";
    } else mp.hidden = true;

    // worksheet
    var studentName = $("studentName").value.trim();
    var studentClass = $("studentClass").value.trim();
    var today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
    var html = "";
    html += '<div class="ws-head"><div class="ws-title-row"><h3 class="ws-title">' +
      subjectLabel() + " Practice — Grade " + meta.grade + '</h3><span class="ws-brand">GridSmith</span></div>';
    html += '<div class="ws-meta">Topics: ' + meta.topics.map(E.esc).join(" · ") + " &nbsp;|&nbsp; " + mixText + "</div>";
    html += '<div class="ws-id">' +
      '<div><label>Student name</label><div class="line">' + E.esc(studentName) + "</div></div>" +
      '<div><label>Class</label><div class="line">' + E.esc(studentClass) + "</div></div>" +
      '<div><label>Date</label><div class="line">' + today + "</div></div>" +
      '<div><label>Score</label><div class="line"></div></div></div></div>';
    html += '<p class="ws-instructions">Answer every question. Show your working in the space below each question — good luck!</p>';
    html += '<ol class="q-list">';
    items.forEach(function (item, ix) {
      if (item.passageTitle) {
        html += '</ol><div class="passage"><span class="passage-kicker">Reading passage</span><h4>' +
          E.esc(item.passageTitle) + "</h4><p>" + E.esc(item.passageText) + '</p></div><ol class="q-list">';
      }
      html += '<li class="q-item"><div class="q-top"><span class="q-num">' + (ix + 1) + '</span><div class="q-body">';
      html += '<div class="q-text">' + item.q + "</div>";
      if (item.options) {
        html += '<ul class="q-options">' + item.options.map(function (o, oi) {
          return "<li><span class=\"opt-letter\">(" + "ABCD"[oi] + ")</span>" + E.esc(o) + "</li>";
        }).join("") + "</ul>";
      } else {
        html += '<div class="answer-space' + (String(item.answer).length <= 12 ? " short" : "") + '"></div>';
      }
      html += '<div class="q-tags"><span class="tag">' + E.esc(item.topicLabel || "") + '</span>' +
        '<span class="tag diff-' + item.diff + '">' + item.diff + "</span></div>";
      html += "</div></div></li>";
    });
    html += "</ol>";
    $("worksheet").innerHTML = html;

    // answer key
    var key = '<div class="key-head"><h3>Answer Key — with worked explanations</h3>' +
      "<p>Grade " + meta.grade + " · " + subjectLabel() + " · For the teacher / parent — not for students.</p></div>";
    items.forEach(function (item, ix) {
      key += '<div class="key-item"><span class="q-num">' + (ix + 1) + '</span> ' +
        '<span class="key-answer">Answer: ' + E.esc(item.answer) + "</span>" +
        '<div class="key-q">' + item.q + "</div>" +
        '<ul class="key-steps">' + item.steps.map(function (s) { return "<li>" + E.esc(s) + "</li>"; }).join("") + "</ul></div>";
    });
    $("answerKey").innerHTML = key;

    var keyBtn = $("btnKey");
    keyBtn.textContent = "Show answer key";
    keyBtn.setAttribute("aria-expanded", "false");
    $("answerKey").hidden = true;
    document.body.classList.toggle("print-key", $("printKey").checked);
  }

  /* ---------- buttons ---------- */
  $("btnGenerate").addEventListener("click", function () {
    generate();
    $("resultWrap").scrollIntoView({ behavior: "smooth", block: "start" });
  });
  $("btnRegen").addEventListener("click", generate);
  $("btnPrint").addEventListener("click", function () { window.print(); });
  $("btnKey").addEventListener("click", function () {
    var key = $("answerKey");
    var show = key.hidden;
    key.hidden = !show;
    this.textContent = show ? "Hide answer key" : "Show answer key";
    this.setAttribute("aria-expanded", String(show));
    if (show) key.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  $("printKey").addEventListener("change", function () {
    document.body.classList.toggle("print-key", this.checked);
  });
  $("gridText").addEventListener("input", function () {
    var prev = $("mappingPreview");
    var text = this.value.trim();
    if (!text) { prev.hidden = true; return; }
    var parsed = E.parseGrid(text, state.grade, state.subject);
    if (!parsed.mapping.length) { prev.hidden = true; return; }
    prev.hidden = false;
    prev.innerHTML = "<h3>Grid preview</h3><ul>" + parsed.mapping.map(function (m) {
      return m.theme
        ? "<li><b>" + E.esc(m.line) + "</b> → word-problem theme</li>"
        : "<li><b>" + E.esc(m.line) + "</b> → " + m.matched.map(E.esc).join(", ") + "</li>";
    }).join("") + "</ul>";
  });

  /* ---------- demo mode (for screenshots & judges) ---------- */
  function demo() {
    var params = new URLSearchParams(location.search);
    var mode = params.get("demo");
    if (!mode) return;
    if (mode === "grid") {
      state.grade = 4; state.subject = "math";
      $("gridText").value = "Penjumlahan dan pengurangan\nPecahan sederhana\nPerkalian dan pembagian\nKehidupan di laut dalam";
      syncControls();
      generate();
    } else if (mode === "english") {
      state.grade = 5; state.subject = "english";
      syncControls();
      generate();
      $("btnKey").click();
    } else if (mode === "key") {
      state.grade = 3; state.subject = "math";
      syncControls();
      generate();
      $("btnKey").click();
    }
  }
  function syncControls() {
    Array.prototype.forEach.call(gradeSeg.children, function (c) {
      c.classList.toggle("active", Number(c.dataset.value) === state.grade);
    });
    Array.prototype.forEach.call(document.querySelectorAll(".subject-card"), function (c) {
      c.classList.toggle("active", c.dataset.subject === state.subject);
    });
    renderTopics();
    updateMix();
  }

  /* ---------- init ---------- */
  buildSegments();
  renderTopics();
  updateMix();
  demo();
})();
