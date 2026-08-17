/* =============================================================================
 * game.js — engine: canvas "van travels the process" map + stage interactions
 *           + gamification (points, trophies, progress) + final quiz.
 * Dependency-free vanilla JS. No build step.
 * ========================================================================== */

(() => {
  "use strict";

  const state = {
    score: 0,
    stageIndex: 0,
    earnedTrophies: [],
    quizIndex: 0,
    phase: "stage" // "stage" | "quiz" | "result"
  };

  const $ = (sel) => document.querySelector(sel);
  const el = (tag, cls, html) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  };

  /* ----------------------------------------------------------------------- */
  /* HEADER / PROGRESS / SCORE                                               */
  /* ----------------------------------------------------------------------- */
  function initChrome() {
    $("#logo").textContent = "IFS";
    $("#t-title").textContent = GAME.meta.title;
    $("#t-sub").textContent = GAME.meta.subtitle;
    renderTrophyRail();
    updateScore(0);
    updateProgress();
  }

  function updateScore(delta) {
    state.score += delta;
    $("#score").textContent = state.score;
  }

  function updateProgress() {
    const total = GAME.stages.length + 1; // stages + quiz
    let done = state.stageIndex;
    if (state.phase === "quiz") done = GAME.stages.length;
    if (state.phase === "result") done = total;
    $("#progressFill").style.width = Math.round((done / total) * 100) + "%";
  }

  function renderTrophyRail() {
    const rail = $("#trophyRail");
    rail.innerHTML = "";
    GAME.stages.forEach((s) => {
      const chip = el("div", "trophy-chip", `${s.icon} ${s.name}`);
      chip.dataset.id = s.id;
      if (state.earnedTrophies.includes(s.id)) chip.classList.add("earned");
      rail.appendChild(chip);
    });
    const q = el("div", "trophy-chip", "🏆 Final Quiz");
    q.dataset.id = "quiz";
    if (state.earnedTrophies.includes("quiz")) q.classList.add("earned");
    rail.appendChild(q);
  }

  function awardTrophy(id) {
    if (!state.earnedTrophies.includes(id)) {
      state.earnedTrophies.push(id);
      renderTrophyRail();
    }
  }

  /* ----------------------------------------------------------------------- */
  /* CANVAS MAP — the van travels between station stops                      */
  /* ----------------------------------------------------------------------- */
  const map = {
    canvas: null, ctx: null, W: 960, H: 260,
    stops: [], van: { x: 0, y: 0 }, targetIdx: 0, anim: 0
  };

  function initMap() {
    map.canvas = $("#map");
    map.ctx = map.canvas.getContext("2d");
    resizeMap();
    window.addEventListener("resize", resizeMap);
    layoutStops();
    map.van.x = map.stops[0].x;
    map.van.y = map.stops[0].y - 26;
    drawMap();
  }

  function resizeMap() {
    const cssW = map.canvas.parentElement.clientWidth;
    const ratio = map.H / map.W;
    const dpr = window.devicePixelRatio || 1;
    map.canvas.style.height = cssW * ratio + "px";
    map.canvas.width = cssW * dpr;
    map.canvas.height = cssW * ratio * dpr;
    map.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    map._w = cssW;
    map._h = cssW * ratio;
    layoutStops();
    drawMap();
  }

  function layoutStops() {
    const n = GAME.stages.length;
    const padX = 70, padTop = 60;
    const usableW = (map._w || map.W) - padX * 2;
    map.stops = GAME.stages.map((s, i) => {
      const x = padX + (usableW * i) / (n - 1);
      const y = padTop + Math.sin(i * 1.1) * 34 + ( (map._h || map.H) * 0.28 );
      return { x, y, stage: s };
    });
    // keep van glued to current stop after relayout
    if (map.stops[map.targetIdx]) {
      map.van.x = map.stops[map.targetIdx].x;
      map.van.y = map.stops[map.targetIdx].y - 26;
    }
  }

  function drawMap() {
    const ctx = map.ctx;
    const W = map._w || map.W, H = map._h || map.H;
    ctx.clearRect(0, 0, W, H);

    // background sky gradient
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#16202b");
    g.addColorStop(1, "#0e151c");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // winding road
    ctx.lineWidth = 26;
    ctx.strokeStyle = "#26313d";
    ctx.lineCap = "round";
    ctx.beginPath();
    map.stops.forEach((s, i) => (i ? ctx.lineTo(s.x, s.y) : ctx.moveTo(s.x, s.y)));
    ctx.stroke();
    // dashed centre line
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#4a5b6d";
    ctx.setLineDash([10, 12]);
    ctx.beginPath();
    map.stops.forEach((s, i) => (i ? ctx.lineTo(s.x, s.y) : ctx.moveTo(s.x, s.y)));
    ctx.stroke();
    ctx.setLineDash([]);

    // stops
    map.stops.forEach((s, i) => {
      const active = i === state.stageIndex && state.phase === "stage";
      const done = state.earnedTrophies.includes(s.stage.id);
      // pin
      ctx.beginPath();
      ctx.arc(s.x, s.y, 18, 0, Math.PI * 2);
      ctx.fillStyle = done ? "#1d3b39" : active ? "#083b38" : "#1b232d";
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = done ? "#38d39f" : active ? "#00b2a9" : "#2c3846";
      ctx.stroke();
      // icon
      ctx.font = "18px serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(done ? "✅" : s.stage.icon, s.x, s.y + 1);
      // label
      ctx.font = "600 12px Segoe UI, sans-serif";
      ctx.fillStyle = active ? "#24d3c8" : "#9fb0c0";
      ctx.fillText(`${i + 1}. ${s.stage.name}`, s.x, s.y + 34);
    });

    drawVan(ctx, map.van.x, map.van.y);
  }

  function drawVan(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);
    // shadow
    ctx.fillStyle = "rgba(0,0,0,.35)";
    ctx.beginPath();
    ctx.ellipse(0, 20, 22, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    // body
    ctx.fillStyle = "#00b2a9";
    roundRect(ctx, -22, -14, 40, 24, 5);
    ctx.fill();
    // cabin
    ctx.fillStyle = "#0e2b29";
    roundRect(ctx, 6, -10, 12, 12, 3);
    ctx.fill();
    // window
    ctx.fillStyle = "#bff5f0";
    roundRect(ctx, 8, -8, 8, 7, 2);
    ctx.fill();
    // wheels
    ctx.fillStyle = "#0c1116";
    circle(ctx, -12, 12, 5);
    circle(ctx, 10, 12, 5);
    ctx.fillStyle = "#5b6b7b";
    circle(ctx, -12, 12, 2);
    circle(ctx, 10, 12, 2);
    ctx.restore();
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function circle(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }

  function driveTo(idx, done) {
    const from = { x: map.van.x, y: map.van.y };
    const stop = map.stops[idx];
    const to = { x: stop.x, y: stop.y - 26 };
    const t0 = performance.now();
    const dur = 900;
    cancelAnimationFrame(map.anim);
    const step = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      const e = p < .5 ? 2 * p * p : -1 + (4 - 2 * p) * p; // ease in-out
      map.van.x = from.x + (to.x - from.x) * e;
      map.van.y = from.y + (to.y - from.y) * e - Math.sin(p * Math.PI) * 18; // little hop
      map.targetIdx = idx;
      drawMap();
      if (p < 1) map.anim = requestAnimationFrame(step);
      else if (done) done();
    };
    map.anim = requestAnimationFrame(step);
  }

  /* ----------------------------------------------------------------------- */
  /* STAGE RENDERING                                                          */
  /* ----------------------------------------------------------------------- */
  function renderStage() {
    state.phase = "stage";
    updateProgress();
    const stage = GAME.stages[state.stageIndex];
    const panel = $("#panel");
    panel.innerHTML = "";

    panel.appendChild(el("div", "stage-tag", `STAGE ${state.stageIndex + 1} / ${GAME.stages.length}`));
    panel.appendChild(el("h2", null, `${stage.icon} ${stage.name}`));
    panel.appendChild(el("div", "teach", stage.teach));
    panel.appendChild(el("div", "prompt", stage.task.prompt));

    const holder = el("div", "task-holder");
    panel.appendChild(holder);

    const fb = el("div", "feedback");
    const actions = el("div", "actions");
    panel.appendChild(fb);
    panel.appendChild(actions);

    const nextBtn = el("button", "btn", "Continue ▶");
    nextBtn.disabled = true;
    nextBtn.onclick = () => advanceStage();

    const onSolved = (ok) => {
      if (ok) {
        fb.className = "feedback ok";
        fb.textContent = "✔ " + stage.task.feedbackRight + `  (+${stage.points} pts)`;
        updateScore(stage.points);
        awardTrophy(stage.id);
        drawMap();
        nextBtn.disabled = false;
      } else {
        fb.className = "feedback no";
        fb.textContent = "✗ " + stage.task.feedbackWrong;
      }
    };

    buildTask(stage.task, holder, onSolved);
    actions.appendChild(nextBtn);

    // drive van to this stop
    driveTo(state.stageIndex);
    panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function advanceStage() {
    state.stageIndex++;
    if (state.stageIndex >= GAME.stages.length) {
      startQuiz();
    } else {
      renderStage();
    }
  }

  /* ----------------------------------------------------------------------- */
  /* TASK BUILDERS                                                            */
  /* ----------------------------------------------------------------------- */
  function buildTask(task, holder, onSolved) {
    switch (task.type) {
      case "pick": return buildPick(task, holder, onSolved);
      case "twopick": return buildTwoPick(task, holder, onSolved);
      case "drag": return buildDrag(task, holder, onSolved);
      case "decision": return buildPick(task, holder, onSolved); // same UI
      case "order": return buildOrder(task, holder, onSolved);
      default: holder.textContent = "Unknown task type: " + task.type;
    }
  }

  function buildPick(task, holder, onSolved) {
    const wrap = el("div", "options");
    let solved = false;
    task.options.forEach((o) => {
      const b = el("div", "opt", o.label);
      b.onclick = () => {
        if (solved) return;
        if (o.correct) {
          b.classList.add("correct");
          solved = true;
          disable(wrap);
          onSolved(true);
        } else {
          b.classList.add("wrong");
          onSolved(false);
        }
      };
      wrap.appendChild(b);
    });
    holder.appendChild(wrap);
  }

  function buildTwoPick(task, holder, onSolved) {
    const picked = {};
    task.groups.forEach((grp, gi) => {
      holder.appendChild(el("div", "group-label", grp.label.toUpperCase()));
      const wrap = el("div", "options");
      grp.options.forEach((o) => {
        const b = el("div", "opt", o.label);
        b.onclick = () => {
          [...wrap.children].forEach((c) => c.classList.remove("correct", "wrong"));
          picked[gi] = o.correct;
          b.classList.add(o.correct ? "correct" : "wrong");
          checkBoth();
        };
        wrap.appendChild(b);
      });
      holder.appendChild(wrap);
    });
    let solved = false;
    function checkBoth() {
      if (solved) return;
      if (Object.keys(picked).length === task.groups.length) {
        const allRight = Object.values(picked).every(Boolean);
        onSolved(allRight);
        if (allRight) solved = true;
      }
    }
  }

  function buildDrag(task, holder, onSolved) {
    const area = el("div", "drag-area");
    const pool = el("div", "drag-pool");
    const drop = el("div", "dropzone", `Drop asset onto<br><b>${task.target}</b>`);
    let solved = false;

    task.options.forEach((o) => {
      const chip = el("div", "chip", "⚙️ " + o.label);
      chip.draggable = true;
      chip.dataset.correct = o.correct;
      chip.addEventListener("dragstart", (e) => {
        chip.classList.add("dragging");
        e.dataTransfer.setData("text/plain", o.label);
        e.dataTransfer.setData("correct", String(o.correct));
      });
      chip.addEventListener("dragend", () => chip.classList.remove("dragging"));
      // touch fallback: tap to select
      chip.addEventListener("click", () => { if (!solved) resolve(o.correct, o.label, chip); });
      pool.appendChild(chip);
    });

    drop.addEventListener("dragover", (e) => { e.preventDefault(); drop.classList.add("over"); });
    drop.addEventListener("dragleave", () => drop.classList.remove("over"));
    drop.addEventListener("drop", (e) => {
      e.preventDefault();
      drop.classList.remove("over");
      const label = e.dataTransfer.getData("text/plain");
      const correct = e.dataTransfer.getData("correct") === "true";
      resolve(correct, label, null);
    });

    function resolve(correct, label, chip) {
      if (solved) return;
      if (correct) {
        solved = true;
        drop.classList.add("filled");
        drop.innerHTML = `✅ <b>${label}</b><br>linked to ${task.target}`;
        onSolved(true);
      } else {
        drop.classList.remove("filled");
        onSolved(false);
      }
    }

    area.appendChild(pool);
    area.appendChild(drop);
    holder.appendChild(el("div", "prompt", "Tip: drag the asset (or tap it on mobile)."));
    holder.appendChild(area);
  }

  function buildOrder(task, holder, onSolved) {
    const correct = task.steps.slice();
    const shuffled = shuffle(correct.slice());
    const list = el("ul", "order-list");
    let dragEl = null;

    shuffled.forEach((txt) => {
      const li = el("li", "order-item", `<span class="handle">☰</span> ${txt}`);
      li.draggable = true;
      li.dataset.text = txt;
      li.addEventListener("dragstart", () => { dragEl = li; li.classList.add("dragging"); });
      li.addEventListener("dragend", () => { li.classList.remove("dragging"); check(); });
      list.appendChild(li);
    });

    list.addEventListener("dragover", (e) => {
      e.preventDefault();
      const after = getAfter(list, e.clientY);
      if (!dragEl) return;
      if (after == null) list.appendChild(dragEl);
      else list.insertBefore(dragEl, after);
    });

    function getAfter(container, y) {
      const items = [...container.querySelectorAll(".order-item:not(.dragging)")];
      return items.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) return { offset, element: child };
        return closest;
      }, { offset: -Infinity }).element;
    }

    let solved = false;
    const checkBtn = el("button", "btn ghost", "Check order");
    function check() { /* live check on drop */ evaluate(); }
    checkBtn.onclick = evaluate;
    function evaluate() {
      if (solved) return;
      const now = [...list.children].map((li) => li.dataset.text);
      const ok = now.every((t, i) => t === correct[i]);
      if (ok) { solved = true; onSolved(true); checkBtn.disabled = true; }
      else onSolved(false);
    }

    holder.appendChild(list);
    holder.appendChild(el("div", "prompt", "Drag rows to reorder, then check."));
    holder.appendChild(checkBtn);
  }

  /* ----------------------------------------------------------------------- */
  /* FINAL QUIZ                                                               */
  /* ----------------------------------------------------------------------- */
  function startQuiz() {
    state.phase = "quiz";
    state.quizIndex = 0;
    updateProgress();
    driveTo(GAME.stages.length - 1);
    renderQuizQuestion();
  }

  function renderQuizQuestion() {
    const quiz = GAME.quiz;
    const q = quiz.questions[state.quizIndex];
    const panel = $("#panel");
    panel.innerHTML = "";
    panel.appendChild(el("div", "stage-tag", "🏆 FINAL KNOWLEDGE CHECK"));
    panel.appendChild(el("div", "quiz-progress",
      `Question ${state.quizIndex + 1} of ${quiz.questions.length}`));
    panel.appendChild(el("div", "quiz-q", q.q));

    const wrap = el("div", "options");
    const fb = el("div", "feedback");
    const actions = el("div", "actions");
    const nextBtn = el("button", "btn", state.quizIndex === quiz.questions.length - 1 ? "See results ▶" : "Next ▶");
    nextBtn.disabled = true;
    let answered = false;

    q.options.forEach((opt, i) => {
      const b = el("div", "opt", opt);
      b.onclick = () => {
        if (answered) return;
        answered = true;
        disable(wrap);
        if (i === q.answer) {
          b.classList.add("correct");
          updateScore(quiz.pointsPerQuestion);
          fb.className = "feedback ok";
          fb.textContent = `✔ Correct! (+${quiz.pointsPerQuestion} pts)`;
        } else {
          b.classList.add("wrong");
          wrap.children[q.answer].classList.add("correct");
          fb.className = "feedback no";
          fb.textContent = "✗ The highlighted answer is correct.";
        }
        nextBtn.disabled = false;
      };
      wrap.appendChild(b);
    });

    nextBtn.onclick = () => {
      state.quizIndex++;
      if (state.quizIndex >= quiz.questions.length) showResult();
      else renderQuizQuestion();
    };

    panel.appendChild(wrap);
    panel.appendChild(fb);
    actions.appendChild(nextBtn);
    panel.appendChild(actions);
    panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  /* ----------------------------------------------------------------------- */
  /* RESULT / TROPHY                                                          */
  /* ----------------------------------------------------------------------- */
  function showResult() {
    state.phase = "result";
    awardTrophy("quiz");
    updateProgress();

    const maxStage = GAME.stages.reduce((a, s) => a + s.points, 0);
    const maxQuiz = GAME.quiz.questions.length * GAME.quiz.pointsPerQuestion;
    const max = maxStage + maxQuiz;
    const pct = Math.round((state.score / max) * 100);
    const stars = pct >= 90 ? 3 : pct >= 60 ? 2 : 1;

    const panel = $("#panel");
    panel.innerHTML = "";
    const r = el("div", "result");
    r.appendChild(el("div", "big-trophy", "🏆"));
    r.appendChild(el("h1", null, "Module Complete!"));
    r.appendChild(el("div", "stars", "★".repeat(stars) + "☆".repeat(3 - stars)));
    r.appendChild(el("div", "final-score", `${state.score} / ${max} points  ·  ${pct}%`));
    r.appendChild(el("p", null, badge(pct)));

    const again = el("button", "btn", "↻ Play again");
    again.onclick = () => resetGame();
    const actions = el("div", "actions");
    actions.style.justifyContent = "center";
    actions.appendChild(again);
    r.appendChild(actions);
    panel.appendChild(r);
    panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
    confettiBurst();
  }

  function badge(pct) {
    if (pct >= 90) return "Outstanding — you’ve mastered Request Initiation basics!";
    if (pct >= 60) return "Nice work — solid understanding of Create New Request.";
    return "Good start — replay to boost your score and retention.";
  }

  function resetGame() {
    state.score = 0; state.stageIndex = 0; state.quizIndex = 0;
    state.earnedTrophies = []; state.phase = "stage";
    map.targetIdx = 0;
    $("#score").textContent = "0";
    renderTrophyRail();
    layoutStops();
    map.van.x = map.stops[0].x; map.van.y = map.stops[0].y - 26;
    renderStage();
  }

  /* ----------------------------------------------------------------------- */
  /* HELPERS                                                                  */
  /* ----------------------------------------------------------------------- */
  function disable(container) {
    [...container.children].forEach((c) => (c.style.pointerEvents = "none"));
  }
  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    // guard: avoid already-sorted order start
    return a;
  }
  function confettiBurst() {
    const colors = ["#00b2a9", "#24d3c8", "#ffcf4d", "#38d39f", "#ff6b6b"];
    for (let i = 0; i < 90; i++) {
      const c = document.createElement("div");
      c.className = "confetti";
      c.style.left = Math.random() * 100 + "vw";
      c.style.background = colors[Math.floor(Math.random() * colors.length)];
      c.style.transform = `rotate(${Math.random() * 360}deg)`;
      document.body.appendChild(c);
      const fall = 2200 + Math.random() * 1500;
      c.animate(
        [{ transform: `translateY(0) rotate(0)`, opacity: 1 },
         { transform: `translateY(105vh) rotate(${720 + Math.random()*360}deg)`, opacity: .9 }],
        { duration: fall, easing: "cubic-bezier(.2,.6,.4,1)" }
      ).onfinish = () => c.remove();
    }
  }

  /* ----------------------------------------------------------------------- */
  /* BOOT                                                                     */
  /* ----------------------------------------------------------------------- */
  window.addEventListener("DOMContentLoaded", () => {
    initChrome();
    initMap();
    renderStage();
  });
})();
