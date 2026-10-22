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
  const CAT_RANK = {};
  CAT_ORDER.forEach((c, i) => { CAT_RANK[c] = i; });
  const PAGE = 60;
  const state = { q: "", cat: "All", source: "all", coach: "all", shown: PAGE, mode: "top" };

  const esc = (s) =>
    String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  const fmtLikes = (n) => {
    if (n == null) return "";
    if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
    if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, "") + "k";
    return String(n);
  };

  // ---- rank within category by likes (desc; unknown likes last; ties: saves first, then title) ----
  const byLikes = (a, b) => {
    const la = a.likes == null ? -1 : a.likes;
    const lb = b.likes == null ? -1 : b.likes;
    if (lb !== la) return lb - la;
    if (a.source !== b.source) return a.source === "saved" ? -1 : 1;
    return a.title.toLowerCase().localeCompare(b.title.toLowerCase());
  };
  CAT_ORDER.slice(0, 15).forEach((cat) => {
    VIDEOS.filter((v) => v.category === cat).sort(byLikes)
      .forEach((v, i) => { v._rank = i + 1; v._top = i < 25; });
  });
  const topVideos = VIDEOS.filter((v) => v._top);
  const topCounts = {};
  topVideos.forEach((v) => { topCounts[v.category] = (topCounts[v.category] || 0) + 1; });

  // ---- header totals (reflect the current mode) ----
  const categorized = VIDEOS.filter((v) => v.category !== "Unsorted").length;
  function updateSubtitle() {
    $("#subtitle").textContent = state.mode === "top"
      ? `${topVideos.length} top videos · Top 25 per category, ranked by likes · ${COACHES.length} coaches`
      : `${VIDEOS.length.toLocaleString()} videos · ${categorized.toLocaleString()} in categories · ${COACHES.length} coaches`;
  }

  // ---- category chips (counts follow the mode) ----
  const counts = {};
  VIDEOS.forEach((v) => { counts[v.category] = (counts[v.category] || 0) + 1; });
  const chipsEl = $("#chips");
  function renderChips() {
    const inTop = state.mode === "top";
    const defs = [{ name: "All", n: inTop ? topVideos.length : VIDEOS.length }].concat(
      CAT_ORDER.filter((c) => !(inTop && c === "Unsorted"))
        .map((c) => ({ name: c, n: inTop ? (topCounts[c] || 0) : (counts[c] || 0) }))
    );
    chipsEl.innerHTML = defs
      .map((d) => `<button class="chip${d.name === state.cat ? " active" : ""}" data-cat="${esc(d.name)}">${esc(d.name)} <span class="chip-n">${d.n}</span></button>`)
      .join("");
  }
  chipsEl.addEventListener("click", (e) => {
    const btn = e.target.closest(".chip");
    if (!btn) return;
    state.cat = btn.dataset.cat;
    state.shown = PAGE;
    renderChips();
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

  // ---- mode toggle ----
  document.querySelector(".mode-toggle").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-mode]");
    if (!btn || btn.dataset.mode === state.mode) return;
    state.mode = btn.dataset.mode;
    state.shown = PAGE;
    if (state.mode === "top" && state.cat === "Unsorted") state.cat = "All";
    document.querySelectorAll(".mode-toggle button").forEach((b) => b.classList.toggle("active", b === btn));
    updateSubtitle();
    renderChips();
    render();
  });

  // ---- filtering + sorting ----
  function filtered() {
    const list = VIDEOS.filter((v) => {
      if (state.mode === "top" && !v._top) return false;
      if (state.cat !== "All" && v.category !== state.cat) return false;
      if (state.source !== "all" && v.source !== state.source) return false;
      if (state.coach !== "all" && v.coach !== state.coach) return false;
      if (state.q) {
        const hay = (v.title + " @" + v.coach).toLowerCase();
        if (!hay.includes(state.q)) return false;
      }
      return true;
    });
    if (state.mode === "top") {
      list.sort((a, b) => (CAT_RANK[a.category] - CAT_RANK[b.category]) || (a._rank - b._rank));
    } else if (state.cat !== "All" && state.cat !== "Unsorted") {
      list.sort(byLikes);
    }
    return list;
  }

  function shortcode(url) {
    const m = String(url || "").match(/\/(?:reel|reels|p|tv)\/([^/?#]+)/);
    return m ? m[1] : null;
  }

  const grid = $("#grid");
  function cardHTML(v) {
    const badge = v.source === "saved"
      ? '<span class="badge badge-saved">★ Saved</span>'
      : '<span class="badge badge-coach">Coach page</span>';
    const rank = v._top ? `<span class="rank-badge">#${v._rank}</span>` : "";
    const likes = v.likes != null ? `<span class="likes">♥ ${fmtLikes(v.likes)}</span>` : "";
    let heroSrc;
    if (v._top) {
      heroSrc = `thumbs/${esc(v.id)}.jpg`;
    } else {
      const sc = shortcode(v.url);
      heroSrc = sc ? `https://www.instagram.com/p/${sc}/media/?size=l` : "";
    }
    const hero = heroSrc
      ? `<div class="hero">${rank}<img src="${esc(heroSrc)}" alt="" loading="lazy" onerror="this.remove()"></div>`
      : `<div class="hero">${rank}</div>`;
    return `<article class="card">
      ${hero}
      <div class="card-top"><span class="pill">${esc(v.category)}</span>${badge}</div>
      <h3 class="card-title">${esc(v.title)}</h3>
      <p class="card-coach"><a href="https://www.instagram.com/${esc(v.coach)}/" target="_blank" rel="noopener">@${esc(v.coach)}</a>${likes}</p>
      <a class="watch" href="${esc(v.url)}" target="_blank" rel="noopener">▶ Watch on Instagram</a>
    </article>`;
  }

  function render() {
    const list = filtered();
    const pool = state.mode === "top" ? topVideos.length : VIDEOS.length;
    $("#resultCount").textContent = list.length === pool
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

  updateSubtitle();
  renderChips();
  render();
})();
