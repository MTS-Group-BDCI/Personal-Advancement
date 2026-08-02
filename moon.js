const MOON_SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

const MOON_PASTELS = [
  "#ffcdd8", "#ffe0c2", "#fff5c2", "#d4f5d4", "#ffe4b8", "#e8dff5",
  "#ffd6f0", "#e8c4c4", "#d4ecd9", "#cfd8e8", "#c8e6f5", "#ddd0f0",
];

const MOON_PASTELS_ACTIVE = [
  "#ffb3c6", "#ffd4a8", "#ffeeb0", "#b8e8b8", "#ffd699", "#d4c4eb",
  "#ffc0e8", "#d4a0a0", "#b8dcc4", "#b0c0d8", "#a8d8f0", "#c8b0e8",
];

const MOON_SIGN_INFO = [
  { theme: "Manifestation", place: "Medicine Hill" },
  { theme: "Maintaining", place: "Roof" },
  { theme: "Brain Dump", place: "Walk" },
  { theme: "Rest", place: "Home" },
  { theme: "Visionary+design (male)", place: "Nose Hill" },
  { theme: "Clean+Organize", place: "Home" },
  { theme: "Organize+Maintain", place: "Home" },
  { theme: "Maintain+Uplift", place: "Home" },
  { theme: "Visionary+design (male)", place: "Nose Hill" },
  { theme: "Let go+Pause", place: "Bike/explore" },
  { theme: "Think different", place: "Home" },
  { theme: "Deep Silent Meditation (reset)", place: "Dale Hodges" },
];

const MOON_DEG_PER_DAY = 13.176396;
const MOON_AVG_SIGN_MS = 2.25 * 86400000;
const MOON_CYCLE_CACHE_KEY = "moon-cycle-v8";
const LON_CACHE = new Map();
const LON_CACHE_MAX = 512;

const MOON_TERMS = [
  [0, 0, 1, 0, 6288774], [2, 0, -1, 0, 1274027], [2, 0, 0, 0, 658314],
  [0, 0, 2, 0, 213618], [0, 1, 0, 0, -185116], [0, 0, 0, 2, -114332],
  [2, 0, -2, 0, 58793], [2, -1, -1, 0, 57066], [2, 0, 1, 0, 53322],
  [2, -1, 0, 0, 45758], [0, 1, -1, 0, -40923], [1, 0, 0, 0, -34720],
  [0, 1, 1, 0, -30383], [2, 0, 0, -2, 15327], [0, 0, 1, 2, -12528],
  [0, 0, 1, -2, 10980], [4, 0, -1, 0, 10675], [0, 0, -1, 2, 10034],
  [2, 0, -1, -2, 8548], [2, 0, 1, -2, -7888], [2, 0, -1, 2, -6760],
  [2, 0, 0, 2, -5163], [0, 0, 2, -2, 4987], [2, -1, 1, 0, 4036],
  [2, 0, -2, -2, 3994], [1, 0, 1, 0, 3861], [1, 0, -1, 0, 3665],
  [1, 1, 0, 0, -2689], [1, 0, 0, -2, -2602], [2, 0, -1, 0, 2390],
  [0, 1, -1, -2, -2348], [0, 0, 0, 1, 2236], [2, -1, -2, 0, -2120],
  [0, 1, 1, -2, -2063], [1, 0, 1, -2, 2048], [2, 1, 0, 0, -1773],
  [2, 0, 1, 2, -1595], [0, 0, 2, 2, 1215], [1, 1, 1, 0, -1110],
  [3, 0, -1, 0, -892], [2, 0, 0, -4, -810], [0, 1, -1, 2, 753],
  [1, 0, 1, 2, 704], [2, 0, -2, 2, 634], [0, 0, 2, 0, 632],
  [1, 0, -1, -2, -587], [2, 0, 2, 0, -540], [0, 0, -2, 2, -468],
  [1, 1, 0, -2, -398], [0, 1, 0, 2, 379],
];

function degMod(d) {
  return ((d % 360) + 360) % 360;
}

function moonEclipticLongitudeMs(ms) {
  const key = Math.floor(ms / 60000);
  if (LON_CACHE.has(key)) return LON_CACHE.get(key);

  const JD = ms / 86400000 + 2440587.5;
  const T = (JD - 2451545.0) / 36525.0;
  const T2 = T * T;
  const T3 = T2 * T;
  const T4 = T3 * T;

  let Lp = 218.3164477 + 481267.88123421 * T - 0.0015786 * T2 + T3 / 538841 - T4 / 65194000;
  let D = 297.8501921 + 445267.1114034 * T - 0.0018819 * T2 + T3 / 545868 - T4 / 113065000;
  let M = 357.5291092 + 35999.0502909 * T - 0.0001536 * T2 + T3 / 24490000;
  let Mp = 134.9633964 + 477198.8675055 * T + 0.0087414 * T2 + T3 / 69699 - T4 / 14712000;
  let F = 93.2720950 + 483202.0175233 * T - 0.0036539 * T2 - T3 / 3526000 + T4 / 863310000;

  const E = 1 - 0.002516 * T - 0.0000074 * T2;
  const E2 = E * E;
  const rad = Math.PI / 180;
  const dR = degMod(D) * rad;
  const mR = degMod(M) * rad;
  const mpR = degMod(Mp) * rad;
  const fR = degMod(F) * rad;

  let sumL = 0;
  for (let i = 0; i < MOON_TERMS.length; i++) {
    const [d, m, mp, ff, coeff] = MOON_TERMS[i];
    let c = coeff;
    if (m === 1 || m === -1) c *= E;
    else if (m === 2 || m === -2) c *= E2;
    sumL += c * Math.sin(d * dR + m * mR + mp * mpR + ff * fR);
  }

  const A1 = degMod(119.75 + 131.849 * T) * rad;
  const A2 = degMod(53.09 + 479264.290 * T) * rad;
  const LpR = degMod(Lp) * rad;
  sumL += 3958 * Math.sin(A1);
  sumL += 1962 * Math.sin(LpR - fR);
  sumL += 318 * Math.sin(A2);

  const lon = degMod(Lp + sumL / 1000000);
  if (LON_CACHE.size >= LON_CACHE_MAX) LON_CACHE.clear();
  LON_CACHE.set(key, lon);
  return lon;
}

function moonSignIndexMs(ms) {
  return Math.floor(moonEclipticLongitudeMs(ms) / 30) % 12;
}

function startOfDayMs(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function findPreviousSignIngressMs(beforeMs) {
  const sign0 = moonSignIndexMs(beforeMs);
  let lo = beforeMs - 4 * 86400000;
  while (lo > beforeMs - 7 * 86400000 && moonSignIndexMs(lo) === sign0) lo -= 3600000;
  let hi = beforeMs;
  while (hi - lo > 30000) {
    const mid = (lo + hi) >> 1;
    if (moonSignIndexMs(mid) === sign0) hi = mid;
    else lo = mid;
  }
  return hi;
}

function findNextSignIngressMs(fromMs) {
  const sign0 = moonSignIndexMs(fromMs);
  const lon0 = moonEclipticLongitudeMs(fromMs);
  const degInSign = ((lon0 % 30) + 30) % 30;
  const degToGo = degInSign < 0.05 ? 30 : 30 - degInSign;
  let lo = fromMs;
  let hi = fromMs + Math.max((degToGo / MOON_DEG_PER_DAY) * 86400000 + 8 * 3600000, 20 * 3600000);

  let guard = 0;
  while (moonSignIndexMs(hi) === sign0 && guard++ < 56) {
    hi += 4 * 3600000;
  }
  if (moonSignIndexMs(hi) === sign0) hi = fromMs + 3.25 * 86400000;

  while (hi - lo > 30000) {
    const mid = (lo + hi) >> 1;
    if (moonSignIndexMs(mid) === sign0) lo = mid;
    else hi = mid;
  }
  return Math.max(hi, fromMs + 1800000);
}

function formatMoonDate(ms) {
  return new Date(ms).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function daysInSign(startMs, endMs) {
  const firstDay = startOfDayMs(startMs);
  const lastDay = startOfDayMs(endMs - 1);
  return Math.max(1, Math.round((lastDay - firstDay) / 86400000) + 1);
}

function formatSignRange(startMs, endMs) {
  const startDay = startOfDayMs(startMs);
  const lastInSignMs = endMs - 1;
  const endDay = startOfDayMs(lastInSignMs);
  if (endDay <= startDay) return formatMoonDate(startMs);
  return `${formatMoonDate(startMs)}–${formatMoonDate(lastInSignMs)}`;
}

function isValidCycle(cycle) {
  if (!cycle?.transits || cycle.transits.length !== 12) return false;
  const start = cycle.cycleDisplayStart ?? cycle.cycleStart;
  if (!cycle.cycleEnd || cycle.cycleEnd <= start) return false;
  return cycle.transits.every(
    (t) =>
      t.end > t.start &&
      t.signIdx >= 0 &&
      t.signIdx < 12 &&
      t.theme &&
      t.place &&
      t.days >= 1 &&
      t.days <= 5
  );
}

function buildTransit(signIdx, start, end, ingress, current) {
  const info = MOON_SIGN_INFO[signIdx];
  return {
    sign: MOON_SIGNS[signIdx],
    signIdx,
    theme: info.theme,
    place: info.place,
    start,
    end,
    ingress,
    current,
    days: daysInSign(start, end),
  };
}

function buildFallbackTransits(fromDate) {
  const cycleStart = startOfDayMs(fromDate);
  const nowMs = fromDate.getTime();
  let ingress = cycleStart;
  const transits = [];
  let signIdx = moonSignIndexMs(nowMs);

  for (let i = 0; i < 12; i++) {
    const start = i === 0 ? cycleStart : ingress;
    const end = start + MOON_AVG_SIGN_MS;
    transits.push(buildTransit(signIdx, start, end, start, i === 0));
    ingress = end;
    signIdx = (signIdx + 1) % 12;
  }

  const currentIdx = transits.findIndex((t) => nowMs >= t.start && nowMs < t.end);
  if (currentIdx >= 0) {
    transits.forEach((t, i) => {
      t.current = i === currentIdx;
    });
  }
  return transits;
}

function computeMoonCycle(fromDate = new Date()) {
  const cycleStart = startOfDayMs(fromDate);
  const nowMs = fromDate.getTime();
  const transits = [];
  let ingress = findPreviousSignIngressMs(nowMs);

  for (let i = 0; i < 12; i++) {
    const end = findNextSignIngressMs(ingress + 60000);
    const mid = ingress + (end - ingress) / 2;
    const signIdx = moonSignIndexMs(mid);
    const displayStart = i === 0 ? cycleStart : ingress;

    transits.push(buildTransit(signIdx, displayStart, end, ingress, false));
    ingress = end;
  }

  const currentIdx = transits.findIndex((t) => nowMs >= t.ingress && nowMs < t.end);
  transits.forEach((t, i) => {
    t.current = i === (currentIdx >= 0 ? currentIdx : 0);
  });

  const cycle = {
    transits,
    cycleStart,
    cycleDisplayStart: cycleStart,
    cycleEnd: transits[11].end,
    current: transits[currentIdx >= 0 ? currentIdx : 0],
  };

  if (!isValidCycle(cycle)) {
    const fallback = buildFallbackTransits(fromDate);
    return {
      transits: fallback,
      cycleStart,
      cycleDisplayStart: cycleStart,
      cycleEnd: fallback[11].end,
      current: fallback.find((t) => t.current) || fallback[0],
      fallback: true,
    };
  }
  return cycle;
}

function serializeCycle(cycle) {
  return {
    cycleStart: cycle.cycleStart,
    cycleDisplayStart: cycle.cycleDisplayStart,
    cycleEnd: cycle.cycleEnd,
    fallback: !!cycle.fallback,
    transits: cycle.transits.map((t) => ({
      sign: t.sign,
      signIdx: t.signIdx,
      theme: t.theme,
      place: t.place,
      start: t.start,
      end: t.end,
      ingress: t.ingress,
      current: t.current,
      days: t.days,
    })),
  };
}

function deserializeCycle(data) {
  const transits = data.transits.map((t) => {
    const signIdx = t.signIdx;
    const info = MOON_SIGN_INFO[signIdx] || {};
    return {
      ...t,
      theme: t.theme || info.theme || "",
      place: t.place || info.place || "",
      ingress: t.ingress ?? t.start,
    };
  });
  const cycle = {
    transits,
    cycleStart: data.cycleStart,
    cycleDisplayStart: data.cycleDisplayStart ?? data.cycleStart,
    cycleEnd: data.cycleEnd,
    current: transits.find((t) => t.current) || transits[0],
    fallback: !!data.fallback,
  };
  return isValidCycle(cycle) ? cycle : null;
}

function localDayKey(date = new Date()) {
  const d = new Date(startOfDayMs(date));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function reconcileCycleForNow(cycle, now = new Date()) {
  if (!isValidCycle(cycle)) return null;

  const nowMs = now.getTime();
  const todayStart = startOfDayMs(now);
  if (cycle.cycleStart !== todayStart) return null;

  const liveSignIdx = moonSignIndexMs(nowMs);
  const currentIdx = cycle.transits.findIndex((t) => nowMs >= t.ingress && nowMs < t.end);
  if (currentIdx < 0) return null;

  const current = cycle.transits[currentIdx];
  if (current.signIdx !== liveSignIdx) return null;

  cycle.transits.forEach((t, i) => {
    t.current = i === currentIdx;
    if (i === 0 && t.start !== todayStart) {
      t.start = todayStart;
      t.days = daysInSign(t.start, t.end);
    }
  });
  cycle.current = cycle.transits[currentIdx];
  cycle.cycleStart = todayStart;
  cycle.cycleDisplayStart = todayStart;
  return cycle;
}

function getMoonCycle(fromDate = new Date(), { forceFresh = false } = {}) {
  const dayKey = localDayKey(fromDate);

  if (!forceFresh) {
    try {
      const raw = sessionStorage.getItem(MOON_CYCLE_CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.key === dayKey) {
          const cached = deserializeCycle(parsed.cycle);
          const reconciled = cached && reconcileCycleForNow(cached, fromDate);
          if (reconciled) return reconciled;
        }
      }
    } catch {
      /* ignore */
    }
  }

  const cycle = computeMoonCycle(fromDate);
  try {
    sessionStorage.setItem(
      MOON_CYCLE_CACHE_KEY,
      JSON.stringify({ key: dayKey, computedAt: Date.now(), cycle: serializeCycle(cycle) })
    );
  } catch {
    /* ignore */
  }
  return cycle;
}

function polar(cx, cy, r, deg) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function donutSegment(cx, cy, rOut, rIn, startDeg, endDeg) {
  const sweep = endDeg - startDeg;
  if (sweep <= 0.2) return "";
  const large = sweep > 180 ? 1 : 0;
  const o1 = polar(cx, cy, rOut, startDeg);
  const o2 = polar(cx, cy, rOut, endDeg);
  const i2 = polar(cx, cy, rIn, endDeg);
  const i1 = polar(cx, cy, rIn, startDeg);
  return [
    `M ${o1.x.toFixed(2)} ${o1.y.toFixed(2)}`,
    `A ${rOut} ${rOut} 0 ${large} 1 ${o2.x.toFixed(2)} ${o2.y.toFixed(2)}`,
    `L ${i2.x.toFixed(2)} ${i2.y.toFixed(2)}`,
    `A ${rIn} ${rIn} 0 ${large} 0 ${i1.x.toFixed(2)} ${i1.y.toFixed(2)}`,
    "Z",
  ].join(" ");
}

function renderMoonWheel(mount, cycle) {
  const { transits, cycleStart, cycleEnd, current } = cycle;
  const displayStart = cycleStart;
  const totalMs = Math.max(cycleEnd - displayStart, 1);
  const cx = 120;
  const cy = 120;
  const rOut = 88;
  const rIn = 78;
  const rOutActive = 92;
  const rInActive = 74;

  mount.textContent = "";
  const wrap = document.createElement("div");
  wrap.className = "moon-wheel-wrap";

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "moon-wheel");
  svg.setAttribute("viewBox", "0 0 240 240");
  svg.setAttribute("role", "img");

  const track = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  track.setAttribute("class", "moon-wheel-track");
  track.setAttribute("cx", String(cx));
  track.setAttribute("cy", String(cy));
  track.setAttribute("r", String((rOut + rIn) / 2));
  track.setAttribute("fill", "none");
  svg.appendChild(track);

  let angle = 0;
  for (let ti = 0; ti < transits.length; ti++) {
    const t = transits[ti];
    const span = Math.max(t.end - t.start, 3600000);
    const sweep = (span / totalMs) * 360;
    const startDeg = angle;
    const endDeg = angle + sweep;
    const isCurrent = !!t.current;
    const dateStr = formatSignRange(t.start, t.end);

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const gap = Math.min(0.35, sweep * 0.04);
    let d = donutSegment(
      cx, cy,
      isCurrent ? rOutActive : rOut,
      isCurrent ? rInActive : rIn,
      startDeg + gap,
      endDeg - gap
    );
    if (!d && sweep > 0) {
      d = donutSegment(
        cx, cy,
        isCurrent ? rOutActive : rOut,
        isCurrent ? rInActive : rIn,
        startDeg,
        startDeg + Math.max(sweep, 1.5)
      );
    }
    if (!d) {
      angle = endDeg;
      continue;
    }

    path.setAttribute("d", d);
    path.setAttribute("fill", isCurrent ? MOON_PASTELS_ACTIVE[t.signIdx] : MOON_PASTELS[t.signIdx]);
    path.setAttribute("class", `moon-seg${isCurrent ? " moon-seg-current" : ""}`);
    path.dataset.sign = t.sign;
    path.dataset.signIdx = String(t.signIdx);
    path.dataset.theme = t.theme;
    path.dataset.place = t.place;
    path.dataset.dateRange = dateStr;
    path.dataset.days = String(t.days);
    path.setAttribute("tabindex", "0");
    path.setAttribute("role", "button");
    path.setAttribute("aria-label", `${t.sign}, ${t.theme}, ${dateStr}`);
    svg.appendChild(path);

    angle = endDeg;
  }

  const hub = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  hub.setAttribute("class", "moon-wheel-hub");
  hub.setAttribute("cx", String(cx));
  hub.setAttribute("cy", String(cy));
  hub.setAttribute("r", "58");
  svg.appendChild(hub);

  const nowAngle = ((Date.now() - displayStart) / totalMs) * 360;
  const needle = polar(cx, cy, 68, nowAngle);
  const needleLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
  needleLine.setAttribute("class", "moon-needle");
  needleLine.setAttribute("x1", String(cx));
  needleLine.setAttribute("y1", String(cy));
  needleLine.setAttribute("x2", needle.x.toFixed(1));
  needleLine.setAttribute("y2", needle.y.toFixed(1));
  svg.appendChild(needleLine);

  const needleDot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  needleDot.setAttribute("class", "moon-needle-dot");
  needleDot.setAttribute("cx", needle.x.toFixed(1));
  needleDot.setAttribute("cy", needle.y.toFixed(1));
  needleDot.setAttribute("r", "3");
  svg.appendChild(needleDot);

  const hubSign = document.createElementNS("http://www.w3.org/2000/svg", "text");
  hubSign.setAttribute("class", "moon-hub-sign");
  hubSign.setAttribute("x", String(cx));
  hubSign.setAttribute("y", String(cy - 14));
  hubSign.setAttribute("text-anchor", "middle");
  hubSign.textContent = current.sign.toLowerCase();
  svg.appendChild(hubSign);

  const hubDate = document.createElementNS("http://www.w3.org/2000/svg", "text");
  hubDate.setAttribute("class", "moon-hub-date");
  hubDate.setAttribute("x", String(cx));
  hubDate.setAttribute("y", String(cy + 2));
  hubDate.setAttribute("text-anchor", "middle");
  hubDate.textContent = formatSignRange(current.start, current.end);
  svg.appendChild(hubDate);

  const hubSub = document.createElementNS("http://www.w3.org/2000/svg", "text");
  hubSub.setAttribute("class", "moon-hub-sub");
  hubSub.setAttribute("x", String(cx));
  hubSub.setAttribute("y", String(cy + 14));
  hubSub.setAttribute("text-anchor", "middle");
  hubSub.textContent = `${current.days}d · today`;
  svg.appendChild(hubSub);

  const hubFocus = document.createElementNS("http://www.w3.org/2000/svg", "text");
  hubFocus.setAttribute("class", "moon-hub-meta");
  hubFocus.setAttribute("x", String(cx));
  hubFocus.setAttribute("y", String(cy + 26));
  hubFocus.setAttribute("text-anchor", "middle");
  hubFocus.textContent = current.theme;
  svg.appendChild(hubFocus);

  const hubPlace = document.createElementNS("http://www.w3.org/2000/svg", "text");
  hubPlace.setAttribute("class", "moon-hub-meta moon-hub-place");
  hubPlace.setAttribute("x", String(cx));
  hubPlace.setAttribute("y", String(cy + 36));
  hubPlace.setAttribute("text-anchor", "middle");
  hubPlace.textContent = current.place;
  svg.appendChild(hubPlace);

  wrap.appendChild(svg);

  const caption = document.createElement("p");
  caption.className = "moon-wheel-caption";
  caption.textContent = `${formatMoonDate(Date.now())} · click any segment for details`;
  wrap.appendChild(caption);

  mount.appendChild(wrap);
  bindMoonSignPopups(mount);
}

function ensureMoonSignDialog() {
  let dialog = document.getElementById("moon-sign-dialog");
  if (dialog) return dialog;

  dialog = document.createElement("dialog");
  dialog.id = "moon-sign-dialog";
  dialog.className = "moon-sign-dialog";
  dialog.innerHTML = `
    <form method="dialog">
      <button type="submit" class="moon-sign-close" aria-label="Close">×</button>
      <p class="moon-sign-name"></p>
      <p class="moon-sign-row"><span class="moon-sign-k">Dates</span><span class="moon-sign-dates"></span></p>
      <p class="moon-sign-row"><span class="moon-sign-k">Duration</span><span class="moon-sign-days"></span></p>
      <p class="moon-sign-row"><span class="moon-sign-k">Focus</span><span class="moon-sign-theme"></span></p>
      <p class="moon-sign-row"><span class="moon-sign-k">Place</span><span class="moon-sign-place"></span></p>
    </form>`;
  document.body.appendChild(dialog);
  return dialog;
}

function openMoonSignPopup(transit) {
  if (!transit?.sign) return;
  const dialog = ensureMoonSignDialog();
  dialog.querySelector(".moon-sign-name").textContent = transit.sign;
  dialog.querySelector(".moon-sign-dates").textContent = transit.dateRange || "—";
  dialog.querySelector(".moon-sign-days").textContent = transit.days
    ? `${transit.days} day${transit.days === 1 ? "" : "s"}`
    : "—";
  dialog.querySelector(".moon-sign-theme").textContent = transit.theme || "—";
  dialog.querySelector(".moon-sign-place").textContent = transit.place || "—";
  if (typeof dialog.showModal === "function") dialog.showModal();
}

function bindMoonSignPopups(mount) {
  mount.querySelectorAll(".moon-seg").forEach((seg) => {
    const open = () =>
      openMoonSignPopup({
        sign: seg.dataset.sign,
        dateRange: seg.dataset.dateRange,
        days: Number(seg.dataset.days),
        theme: seg.dataset.theme,
        place: seg.dataset.place,
      });
    seg.addEventListener("click", (e) => {
      e.stopPropagation();
      open();
    });
    seg.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open();
      }
    });
  });
}

function createMoonTransitPlaceholder() {
  const section = document.createElement("section");
  section.className = "pa-dash-section moon-transit-section";
  section.innerHTML =
    '<span class="field-label">Moon transits</span><div class="moon-wheel-mount"><div class="moon-wheel-skeleton" aria-hidden="true"></div></div>';
  return section;
}

function refreshMoonWheel(section, { forceFresh = false } = {}) {
  const mount = section?.querySelector(".moon-wheel-mount");
  if (!mount) return;

  try {
    const cycle = getMoonCycle(new Date(), { forceFresh });
    renderMoonWheel(mount, cycle);
    mount.dataset.moonDayKey = localDayKey();
    mount.dataset.moonSign = cycle.current?.sign || "";
  } catch (err) {
    console.error("Moon wheel refresh error:", err);
    const fallback = buildFallbackTransits(new Date());
    renderMoonWheel(mount, {
      transits: fallback,
      cycleStart: startOfDayMs(new Date()),
      cycleDisplayStart: startOfDayMs(new Date()),
      cycleEnd: fallback[11].end,
      current: fallback.find((t) => t.current) || fallback[0],
      fallback: true,
    });
    mount.dataset.moonDayKey = localDayKey();
    mount.dataset.moonSign = fallback.find((t) => t.current)?.sign || "";
  }
}

function mountMoonWheel(section) {
  const mount = section.querySelector(".moon-wheel-mount");
  if (!mount) return;

  const render = () => refreshMoonWheel(section, { forceFresh: true });

  if ("requestIdleCallback" in window) {
    requestIdleCallback(render, { timeout: 200 });
  } else {
    setTimeout(render, 0);
  }

  const recheck = () => {
    if (document.visibilityState && document.visibilityState !== "visible") return;
    const live = getMoonCycle(new Date());
    const dayKey = localDayKey();
    const sign = live.current?.sign || "";
    if (mount.dataset.moonDayKey !== dayKey || mount.dataset.moonSign !== sign) {
      refreshMoonWheel(section, { forceFresh: true });
      return;
    }
    const reconciled = reconcileCycleForNow(live, new Date());
    if (!reconciled) refreshMoonWheel(section, { forceFresh: true });
  };

  document.addEventListener("visibilitychange", recheck);
  window.addEventListener("pageshow", recheck);
  window.addEventListener("focus", recheck);
  setInterval(recheck, 60000);
}

window.createMoonTransitPlaceholder = createMoonTransitPlaceholder;
window.mountMoonWheel = mountMoonWheel;
