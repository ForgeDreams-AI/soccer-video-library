/* Soccer Video Library — app */
(function () {
  "use strict";
  const $ = (s) => document.querySelector(s);

  const CAT_ORDER = [
    "Playing from back", "Passing patterns", "Passing patterns to finish",
    "Possession in the middle third", "Possession in the final third",
    "Pressing when losing the ball", "Line of confrontation",
    "Transitions to the middle third", "Transitions to the final third",
    "Switching the point of attack", "Crossing", "Finishing",
    "Getting into shapes", "Warm up games", "Set pieces", "Unsorted",
  ];
  const PAGE = 60;
  const state = { q: "", cat: "All", source: "all", coach: "all", shown: PAGE };

  const esc = (s) =>
    String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  // ---- header totals ----
  const categorized = VIDEOS.filter((v) => v.category !== "Unsorted").length;
  $("#subtitle").textContent =
    `${VIDEOS.length.toLocaleString()} videos · ${categorized.toLocaleString()} in categories · ${COACHES.length} coaches`;

  // ---- category chips (counts = library totals per category) ----
  const counts = {};
  VIDEOS.forEach((v) => { counts[v.category] = (counts[v.category] || 0) + 1; });
  const chipsEl = $("#chips");
  const chipDefs = [{ name: "All", n: VIDEOS.length }].concat(
    CAT_ORDER.map((c) => ({ name: c, n: counts[c] || 0 }))
  );
  chipsEl.innerHTML = chipDefs
    .map((d) => `<button class="chip${d.name === "All" ? " active" : ""}" data-cat="${esc(d.name)}">${esc(d.name)} <span class="chip-n">${d.n}</span></button>`)
    .join("");
  chipsEl.addEventListener("click", (e) => {
    const btn = e.target.closest(".chip");
    if (!btn) return;
    state.cat = btn.dataset.cat;
    state.shown = PAGE;
    chipsEl.querySelectorAll(".chip").forEach((c) => c.classList.toggle("active", c === btn));
    render();
  });

  // ---- coach dropdown ----
  const byCoach = {};
  VIDEOS.forEach((v) => { byCoach[v.coach] = (byCoach[v.coach] || 0) + 1; });
  const coachSel = $("#coachFilter");
  Object.keys(byCoach)
    .sort((a, b) => byCoach[b] - byCoach[a] || a.localeCompare(b))
    .forEach((u) => {
      const opt = document.createElement("option");
      opt.value = u;
      opt.textContent = `@${u} (${byCoach[u]})`;
      coachSel.appendChild(opt);
    });
  coachSel.addEventListener("change", () => { state.coach = coachSel.value; state.shown = PAGE; render(); });

  // ---- search ----
  let searchTimer = null;
  $("#q").addEventListener("input", (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => { state.q = e.target.value.trim().toLowerCase(); state.shown = PAGE; render(); }, 120);
  });

  // ---- source toggle ----
  document.querySelector(".source-toggle").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-source]");
    if (!btn) return;
    state.source = btn.dataset.source;
    state.shown = PAGE;
    document.querySelectorAll(".source-toggle button").forEach((b) => b.classList.toggle("active", b === btn));
    render();
  });

  // ---- filtering + render ----
  function filtered() {
    return VIDEOS.filter((v) => {
      if (state.cat !== "All" && v.category !== state.cat) return false;
      if (state.source !== "all" && v.source !== state.source) return false;
      if (state.coach !== "all" && v.coach !== state.coach) return false;
      if (state.q) {
        const hay = (v.title + " @" + v.coach).toLowerCase();
        if (!hay.includes(state.q)) return false;
      }
      return true;
    });
  }

  const grid = $("#grid");
  function cardHTML(v) {
    const badge = v.source === "saved"
      ? '<span class="badge badge-saved">★ Saved</span>'
      : '<span class="badge badge-coach">Coach page</span>';
    return `<article class="card">
      <div class="card-top"><span class="pill">${esc(v.category)}</span>${badge}</div>
      <h3 class="card-title">${esc(v.title)}</h3>
      <p class="card-coach"><a href="https://www.instagram.com/${esc(v.coach)}/" target="_blank" rel="noopener">@${esc(v.coach)}</a></p>
      <a class="watch" href="${esc(v.url)}" target="_blank" rel="noopener">▶ Watch on Instagram</a>
    </article>`;
  }

  function render() {
    const list = filtered();
    $("#resultCount").textContent = list.length === VIDEOS.length
      ? `Showing ${Math.min(state.shown, list.length)} of ${list.length} videos`
      : `${list.length} videos match · showing ${Math.min(state.shown, list.length)}`;
    grid.innerHTML = list.slice(0, state.shown).map(cardHTML).join("");
    $("#showMore").style.display = list.length > state.shown ? "" : "none";
    $("#emptyMsg").hidden = list.length !== 0;
  }
  $("#showMore").addEventListener("click", () => { state.shown += PAGE; render(); });

  // ---- coaches section ----
  $("#coachGrid").innerHTML = COACHES.map((c) => `
    <article class="card coach-card">
      ${c.pic ? `<img class="coach-pic" src="${esc(c.pic)}" alt="" loading="lazy" onerror="this.remove()">` : ""}
      <h3 class="card-title">${esc(c.name)}</h3>
      <p class="card-coach">@${esc(c.username)}</p>
      <p class="coach-count">${c.videos} videos in the library · ${c.total} posts swept</p>
      <a class="watch" href="${esc(c.profile)}" target="_blank" rel="noopener">View on Instagram</a>
    </article>`).join("");

  render();
})();
