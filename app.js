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
    "Getting into shapes", "Warm up games", "Set pieces", "Technical", "Unsorted",
  ];
  const CAT_RANK = {};
  CAT_ORDER.forEach((c, i) => { CAT_RANK[c] = i; });
  const PAGE = 60;
  const state = { q: "", cat: "All", source: "all", coach: "all", shown: PAGE, mode: "top" };

  // ---- Brophy Drill Library: "Add to Drill Library" deep link ----
  // Opens the drill library's Add form with this video prefilled (name,
  // category, Instagram link, source coach). The drill library is the
  // Brophy Firebase project; coaches sign in there to finish + save.
  const DRILL_LIBRARY_URL = "https://brophy-drill-library.web.app";
  const THUMB_BASE = "https://forgedreams-ai.github.io/soccer-video-library/thumbs";
  const DRILL_CATS = [
    "Playing from back", "Transitions to the middle third",
    "Possession in the middle third", "Transitions to the final third",
    "Possession in the final third", "Switching the point of attack",
    "Crossing", "Finishing", "Passing patterns",
    "Passing patterns to finish", "Warm up games",
    "Pressing when losing the ball", "Getting into shapes",
    "Line of confrontation", "Set pieces",
  ];
  function drillLibraryLink(v) {
    const q = new URLSearchParams({
      add: "1",
      name: v.name || v.title,
      videoUrl: v.url,
      coach: v.coach,
    });
    // Only the 15 drill categories map over; "Technical" / "Unsorted"
    // are left out so the coach picks the category in the form.
    if (DRILL_CATS.includes(v.category)) q.set("cat", v.category);
    // The setup still doubles as the drill's diagram photo in the drill
    // library, so coaches don't have to hand-draw the diagram.
    q.set("diagram", `${THUMB_BASE}/${v.id}.jpg`);
    return `${DRILL_LIBRARY_URL}/?${q.toString()}`;
  }

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
  CAT_ORDER.slice(0, -1).forEach((cat) => {
    VIDEOS.filter((v) => v.category === cat).sort(byLikes)
      .forEach((v, i) => { v._rank = i + 1; v._top = i < 25; });
  });
  const topVideos = VIDEOS.filter((v) => v._top);
  const topCounts = {};
  topVideos.forEach((v) => { topCounts[v.category] = (topCounts[v.category] || 0) + 1; });

  // ---- series clusters: parts of one series stay together wherever they show ----
  const seriesKey = (v) => (v.series ? `${v.coach}||${v.series}` : null);
  const seriesOf = {};
  VIDEOS.forEach((v) => {
    const k = seriesKey(v);
    if (k) (seriesOf[k] = seriesOf[k] || []).push(v);
  });
  const seriesBestLikes = (v) => {
    const k = seriesKey(v);
    if (!k) return v.likes == null ? -1 : v.likes;
    return Math.max(...seriesOf[k].map((s) => (s.likes == null ? -1 : s.likes)));
  };
  const seriesBestRank = (v) => {
    const k = seriesKey(v);
    if (!k) return v._rank == null ? 1e9 : v._rank;
    return Math.min(...seriesOf[k].map((s) => (s._rank == null ? 1e9 : s._rank)));
  };
  // Within a category: clusters sort by their best member, parts in order.
  const byClusterLikes = (a, b) => {
    const la = seriesBestLikes(a), lb = seriesBestLikes(b);
    if (lb !== la) return lb - la;
    if ((a.series || "") !== (b.series || "")) return String(a.series || "").localeCompare(String(b.series || ""));
    if (a.part != null && b.part != null) return a.part - b.part;
    return a.title.toLowerCase().localeCompare(b.title.toLowerCase());
  };
  const byClusterRank = (a, b) => {
    const ra = seriesBestRank(a), rb = seriesBestRank(b);
    if (ra !== rb) return ra - rb;
    if ((a.series || "") !== (b.series || "")) return String(a.series || "").localeCompare(String(b.series || ""));
    if (a.part != null && b.part != null) return a.part - b.part;
    return (a._rank || 1e9) - (b._rank || 1e9);
  };

  // ---- header totals (reflect the current mode) ----
  const categorized = VIDEOS.filter((v) => v.category !== "Unsorted").length;
  function updateSubtitle() {
    $("#subtitle").textContent = state.mode === "top"
      ? `${topVideos.length} top videos · Top 25 per category, series kept together · ${COACHES.length} coaches`
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
      // Top mode: a series rides along with its top-ranked part, so all parts show together.
      if (state.mode === "top") {
        if (!v._top) {
          const k = seriesKey(v);
          if (!k || !seriesOf[k].some((s) => s._top)) return false;
        }
      }
      if (state.cat !== "All" && v.category !== state.cat) return false;
      if (state.source !== "all" && v.source !== state.source) return false;
      if (state.coach !== "all" && v.coach !== state.coach) return false;
      if (state.q) {
        const hay = (v.title + " " + (v.name || "") + " @" + v.coach).toLowerCase();
        if (!hay.includes(state.q)) return false;
      }
      return true;
    });
    if (state.mode === "top") {
      list.sort((a, b) => (CAT_RANK[a.category] - CAT_RANK[b.category]) || byClusterRank(a, b));
    } else if (state.cat !== "All" && state.cat !== "Unsorted") {
      list.sort(byClusterLikes);
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
    let heroSrc, heroOnErr;
    if (v._top) {
      heroSrc = `thumbs/${esc(v.id)}.jpg`;
      heroOnErr = `this.remove()`;
    } else {
      // All view: try the local thumb first (covers Technical + any other
      // pulled stills), fall back once to Instagram's media endpoint.
      const sc = shortcode(v.url);
      heroSrc = `thumbs/${esc(v.id)}.jpg`;
      const remote = sc ? `https://www.instagram.com/p/${sc}/media/?size=l` : "";
      heroOnErr = remote
        ? `if(this.dataset.fb){this.remove()}else{this.dataset.fb='1';this.src='${remote}'}`
        : `this.remove()`;
    }
    const hero = heroSrc
      ? `<div class="hero">${rank}<img src="${esc(heroSrc)}" alt="" loading="lazy" onerror="${heroOnErr}"></div>`
      : `<div class="hero">${rank}</div>`;
    const displayName = v.name || v.title;
    const orig = v.name && v.name !== v.title
      ? `<p class="card-orig">${esc(v.title)}</p>` : "";
    const partBadge = v.part != null
      ? `<span class="part-badge">Part ${v.part} of ${v.parts || "?"}</span>` : "";
    const chips = v.chips && v.chips.length
      ? `<div class="card-chips">${v.chips.map((c) => `<span class="mini-chip">${esc(c)}</span>`).join("")}</div>` : "";
    return `<article class="card">
      ${hero}
      <div class="card-top"><span class="pill">${esc(v.category)}</span>${partBadge}${badge}</div>
      <h3 class="card-title">${esc(displayName)}</h3>
      ${orig}
      ${chips}
      <p class="card-coach"><a href="https://www.instagram.com/${esc(v.coach)}/" target="_blank" rel="noopener">@${esc(v.coach)}</a>${likes}</p>
      <a class="watch" href="${esc(v.url)}" target="_blank" rel="noopener">▶ Watch on Instagram</a>
      <a class="add-drill" href="${esc(drillLibraryLink(v))}" target="_blank" rel="noopener">＋ Add to Brophy Library</a>
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
