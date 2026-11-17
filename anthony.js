/* How Anthony Has It — Anthony's Instagram Saved collections, rendered
   from data.js (the library) + anthony-data.js (collection membership).
   A video shows under every collection it sits in, in the order it sits
   in that collection on Instagram. Only library videos are listed. */
(function () {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const esc = (s) =>
    String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const fmtLikes = (n) => {
    if (n == null) return "";
    if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
    if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, "") + "k";
    return String(n);
  };
  const shortcode = (url) => {
    const m = String(url || "").match(/\/(?:reel|reels|p|tv)\/([^/?#]+)/);
    return m ? m[1] : null;
  };

  // ---- "Add to Brophy Library" deep link (same as the main library) ----
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
    if (DRILL_CATS.includes(v.category)) q.set("cat", v.category);
    q.set("diagram", `${THUMB_BASE}/${v.id}.jpg`);
    return `${DRILL_LIBRARY_URL}/?${q.toString()}`;
  }

  const byId = {};
  VIDEOS.forEach((v) => { byId[v.id] = v; });

  function cardHTML(v) {
    const likes = v.likes != null ? `<span class="likes">♥ ${fmtLikes(v.likes)}</span>` : "";
    const sc = shortcode(v.url);
    const remote = sc ? `https://www.instagram.com/p/${sc}/media/?size=l` : "";
    const heroOnErr = remote
      ? `if(this.dataset.fb){this.remove()}else{this.dataset.fb='1';this.src='${remote}'}`
      : `this.remove()`;
    const displayName = v.name || v.title;
    const orig = v.name && v.name !== v.title
      ? `<p class="card-orig">${esc(v.title)}</p>` : "";
    const partBadge = v.part != null
      ? `<span class="part-badge">Part ${v.part} of ${v.parts || "?"}</span>` : "";
    const chips = v.chips && v.chips.length
      ? `<div class="card-chips">${v.chips.map((c) => `<span class="mini-chip">${esc(c)}</span>`).join("")}</div>` : "";
    return `<article class="card">
      <div class="hero"><img src="thumbs/${esc(v.id)}.jpg" alt="" loading="lazy" onerror="${heroOnErr}"></div>
      <div class="card-top"><span class="pill">${esc(v.category)}</span>${partBadge}<span class="badge badge-saved">★ Saved</span></div>
      <h3 class="card-title">${esc(displayName)}</h3>
      ${orig}
      ${chips}
      <p class="card-coach"><a href="https://www.instagram.com/${esc(v.coach)}/" target="_blank" rel="noopener">@${esc(v.coach)}</a>${likes}</p>
      <a class="watch" href="${esc(v.url)}" target="_blank" rel="noopener">▶ Watch on Instagram</a>
      <a class="add-drill" href="${esc(drillLibraryLink(v))}" target="_blank" rel="noopener">＋ Add to Brophy Library</a>
    </article>`;
  }

  const total = ANTHONY_COLLECTIONS.reduce((n, c) => n + c.videos.length, 0);
  $("#subtitle").textContent =
    `${total} videos · ${ANTHONY_COLLECTIONS.length} collections · exactly how Anthony has them saved on Instagram`;

  // anchor chips
  $("#chips").innerHTML = ANTHONY_COLLECTIONS.map((c, i) =>
    `<a class="chip" href="#c-${i}">${esc(c.name)} <span class="chip-n">${c.videos.length}</span></a>`
  ).join("");

  const wrap = $("#collections");
  wrap.innerHTML = ANTHONY_COLLECTIONS.map((c, i) => {
    const vids = c.videos.map((id) => byId[id]).filter(Boolean);
    const body = vids.length
      ? `<div class="grid">${vids.map(cardHTML).join("")}</div>`
      : `<p class="empty">No videos from this collection are in the library yet.</p>`;
    return `<section class="collection" id="c-${i}">
      <h2>${esc(c.name)} <span class="collection-count">${vids.length} video${vids.length === 1 ? "" : "s"}</span></h2>
      ${body}
    </section>`;
  }).join("");
})();
