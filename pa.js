const PA_STORAGE_KEY = "personal-advancement-log";
const PA_API = "/api/pa-log";

const PA_SECTIONS = ["WORK", "HEALTH", "METRICS", "FINANCIAL", "Night Routine", "Magick"];

const PA_FIELDS = [
  { key: "date", label: "Date", type: "date" },
  { key: "workBdci", label: "BDCI (min)", type: "number", section: "WORK" },
  { key: "workCfc", label: "CFC Research (min)", type: "number", section: "WORK" },
  { key: "workCityProphet", label: "City Prophet (min)", type: "number", section: "WORK" },
  { key: "workLove", label: "LOVE Architecture (min)", type: "number", section: "WORK" },
  { key: "workGrowth", label: "Perceived Growth", type: "stars", section: "WORK" },
  { key: "workNotes", label: "Notes", type: "text", section: "WORK" },
  { key: "healthRun", label: "Distance Run (km)", type: "number", step: "0.1", section: "HEALTH" },
  { key: "healthWorkout", label: "Workout", type: "yesno", section: "HEALTH" },
  { key: "healthActiveCal", label: "Active cal", type: "number", section: "HEALTH" },
  { key: "healthMental", label: "Mental Health", type: "stars", section: "HEALTH" },
  { key: "healthSleepDur", label: "Sleep Duration (hours)", type: "number", step: "0.1", section: "HEALTH" },
  { key: "healthSleepScore", label: "Sleep Score", type: "number", section: "HEALTH" },
  { key: "healthBedtime", label: "Bedtime", type: "number", step: "0.01", section: "HEALTH" },
  { key: "healthSocial", label: "Social", type: "stars", section: "HEALTH" },
  { key: "healthBrenna", label: "Time with Brenna", type: "stars", section: "HEALTH" },
  { key: "metricsScreen", label: "Screentime (min)", type: "number", section: "METRICS" },
  { key: "metricsInsta", label: "Insta (min)", type: "number", section: "METRICS" },
  { key: "metricsYoutube", label: "Youtube (min)", type: "number", section: "METRICS" },
  { key: "metricsMandarin", label: "Mandarin (min)", type: "number", section: "METRICS" },
  { key: "metricsReading", label: "Reading (min)", type: "number", section: "METRICS" },
  { key: "metricsPython", label: "Python (min)", type: "number", section: "METRICS" },
  { key: "finEssential", label: "Essential Spending", type: "number", step: "0.01", section: "FINANCIAL" },
  { key: "finMedium", label: "Medium Spending", type: "number", step: "0.01", section: "FINANCIAL" },
  { key: "finNonEssential", label: "Non Essential Spending", type: "number", step: "0.01", section: "FINANCIAL" },
  { key: "finInvestment", label: "Investment", type: "number", step: "0.01", section: "FINANCIAL" },
  { key: "nightClean", label: "Clean Room+Apartment", type: "yesno", section: "Night Routine" },
  { key: "nightBrush", label: "Brush Teeth", type: "yesno", section: "Night Routine" },
  { key: "nightReady", label: "Ready", type: "yesno", section: "Night Routine" },
  { key: "magickReflection", label: "Magick Practice Reflection", type: "textarea", section: "Magick" },
  { key: "magickApplication", label: "Magick Application", type: "stars", section: "Magick" },
];

const PA_TREND_NUMERIC = [
  { key: "workBdci", label: "BDCI (min)" },
  { key: "healthRun", label: "Run (km)" },
  { key: "healthSleepDur", label: "Sleep (h)" },
  { key: "healthSleepScore", label: "Sleep score" },
  { key: "metricsScreen", label: "Screentime" },
  { key: "metricsReading", label: "Reading" },
  { key: "metricsPython", label: "Python" },
];

const PA_TREND_STARS = [
  { key: "workGrowth", label: "Growth" },
  { key: "healthMental", label: "Mental health" },
  { key: "healthSocial", label: "Social" },
  { key: "healthBrenna", label: "Brenna" },
  { key: "magickApplication", label: "Magick" },
];

const LEGACY_SCHEDULE_KEY = "schedule-planner-events";

let paLog = [];

function clearLegacyData() {
  localStorage.removeItem(LEGACY_SCHEDULE_KEY);
}

function loadPaLogLocal() {
  try {
    const raw = localStorage.getItem(PA_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function loadPaLogFromServer() {
  try {
    const res = await fetch(PA_API);
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return null;
  }
}

async function savePaLogToServer(rows) {
  const res = await fetch(PA_API, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(rows),
  });
  if (!res.ok) throw new Error(`save failed (${res.status})`);
}

async function loadPaLog() {
  const fromServer = await loadPaLogFromServer();
  if (fromServer !== null) {
    if (!fromServer.length) {
      const local = loadPaLogLocal();
      if (local.length) {
        try {
          await savePaLogToServer(local);
        } catch {
          /* keep local copy if server save fails */
        }
        return local;
      }
    }
    localStorage.setItem(PA_STORAGE_KEY, JSON.stringify(fromServer));
    return fromServer;
  }
  return loadPaLogLocal();
}

async function savePaLog() {
  localStorage.setItem(PA_STORAGE_KEY, JSON.stringify(paLog));
  try {
    await savePaLogToServer(paLog);
  } catch (err) {
    console.warn("Could not save log file:", err);
  }
}

function paTodayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatMDY(iso) {
  const d = new Date(iso + "T12:00:00");
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
}

function parseISO(iso) {
  return new Date(iso + "T12:00:00");
}

function getPaEntry(iso) {
  return paLog.find((e) => e.date === iso) || null;
}

function sortedPaLog() {
  return [...paLog].sort((a, b) => a.date.localeCompare(b.date));
}

function entriesInRange(days) {
  const end = parseISO(paTodayISO());
  const start = new Date(end);
  start.setDate(start.getDate() - (days - 1));
  return sortedPaLog().filter((e) => {
    const d = parseISO(e.date);
    return d >= start && d <= end;
  });
}

function avg(entries, key) {
  const vals = entries.map((e) => Number(e[key])).filter((n) => !Number.isNaN(n));
  if (!vals.length) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function yesRate(entries, key) {
  const vals = entries.filter((e) => e[key] === "yes" || e[key] === "no");
  if (!vals.length) return null;
  return vals.filter((e) => e[key] === "yes").length / vals.length;
}

function totalWorkMin(entry) {
  return (
    (Number(entry.workBdci) || 0) +
    (Number(entry.workCfc) || 0) +
    (Number(entry.workCityProphet) || 0) +
    (Number(entry.workLove) || 0)
  );
}

function totalSpend(entry) {
  return (Number(entry.finEssential) || 0) + (Number(entry.finMedium) || 0) + (Number(entry.finNonEssential) || 0);
}

function escapeCsv(val) {
  const s = val == null ? "" : String(val);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function paToCsv(rows) {
  const keys = PA_FIELDS.map((f) => f.key);
  const header = PA_FIELDS.map((f) => f.label).join(",");
  const lines = rows.map((row) => keys.map((k) => escapeCsv(row[k] ?? "")).join(","));
  return [header, ...lines].join("\n");
}

function exportPaCsv() {
  const blob = new Blob([paToCsv(sortedPaLog())], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `personal-advancement-${paTodayISO()}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function readFormValues(form) {
  const record = { date: form.querySelector('[name="date"]').value };
  PA_FIELDS.forEach((field) => {
    if (field.key === "date") return;
    if (field.type === "yesno") {
      const active = form.querySelector(`.pa-yesno[data-field="${field.key}"] .active`);
      record[field.key] = active ? active.dataset.value : "";
    } else if (field.type === "stars") {
      const group = form.querySelector(`.pa-stars[data-field="${field.key}"]`);
      record[field.key] = group?.dataset.value || "";
    } else {
      const el = form.querySelector(`[name="${field.key}"]`);
      record[field.key] = el ? el.value.trim() : "";
    }
  });
  return record;
}

function fillForm(form, entry) {
  const date = entry?.date || paTodayISO();
  form.querySelector('[name="date"]').value = date;

  PA_FIELDS.forEach((field) => {
    if (field.key === "date") return;
    const val = entry?.[field.key] ?? "";
    if (field.type === "yesno") {
      form.querySelectorAll(`.pa-yesno[data-field="${field.key}"] button`).forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.value === val);
      });
    } else if (field.type === "stars") {
      const group = form.querySelector(`.pa-stars[data-field="${field.key}"]`);
      group.dataset.value = val;
      group.querySelectorAll("button").forEach((btn) => {
        btn.classList.toggle("active", val && Number(btn.dataset.value) <= Number(val));
      });
    } else {
      const el = form.querySelector(`[name="${field.key}"]`);
      if (el) el.value = val;
    }
  });
}

function bindYesNo(container) {
  container.querySelectorAll(".pa-yesno").forEach((group) => {
    group.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", () => {
        group.querySelectorAll("button").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
      });
    });
  });
}

function bindStars(container) {
  container.querySelectorAll(".pa-stars").forEach((group) => {
    group.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", () => {
        const v = btn.dataset.value;
        if (group.dataset.value === v) {
          group.dataset.value = "";
          group.querySelectorAll("button").forEach((b) => b.classList.remove("active"));
        } else {
          group.dataset.value = v;
          group.querySelectorAll("button").forEach((b) => {
            b.classList.toggle("active", Number(b.dataset.value) <= Number(v));
          });
        }
      });
    });
  });
}

function fieldHtml(field) {
  if (field.type === "date") {
    return `<label class="pa-field"><span>${field.label}</span><input type="date" name="date" required></label>`;
  }
  if (field.type === "number") {
    const step = field.step ? ` step="${field.step}"` : "";
    return `<label class="pa-field"><span>${field.label}</span><input type="number" name="${field.key}" min="0"${step}></label>`;
  }
  if (field.type === "text") {
    return `<label class="pa-field"><span>${field.label}</span><input type="text" name="${field.key}"></label>`;
  }
  if (field.type === "textarea") {
    return `<label class="pa-field"><span>${field.label}</span><textarea name="${field.key}" rows="2"></textarea></label>`;
  }
  if (field.type === "yesno") {
    return `<div class="pa-field"><span>${field.label}</span><div class="pa-yesno" data-field="${field.key}"><button type="button" data-value="yes">Yes</button><button type="button" data-value="no">No</button></div></div>`;
  }
  if (field.type === "stars") {
    const stars = [1, 2, 3, 4, 5].map((n) => `<button type="button" data-value="${n}">${n}</button>`).join("");
    return `<div class="pa-field"><span>${field.label}</span><div class="pa-stars" data-field="${field.key}">${stars}</div></div>`;
  }
  return "";
}

function buildFormPanel() {
  const panel = document.createElement("div");
  panel.className = "pa-form-panel";

  const heading = document.createElement("h2");
  heading.className = "pa-heading";
  heading.textContent = "Personal Advancement";
  panel.appendChild(heading);

  const note = document.createElement("p");
  note.className = "pa-note";
  note.textContent = "Daily log — one row per date. Submit updates that day's sheet entry.";
  panel.appendChild(note);

  const form = document.createElement("form");
  form.className = "pa-form";
  form.id = "pa-form";

  form.appendChild(Object.assign(document.createElement("div"), { innerHTML: fieldHtml(PA_FIELDS[0]) }));

  PA_SECTIONS.forEach((section) => {
    const sec = document.createElement("div");
    sec.className = "pa-section";
    sec.innerHTML = `<span class="field-label">${section}</span>`;
    PA_FIELDS.filter((f) => f.section === section).forEach((field) => {
      sec.insertAdjacentHTML("beforeend", fieldHtml(field));
    });
    form.appendChild(sec);
  });

  const actions = document.createElement("div");
  actions.className = "pa-form-actions";
  actions.innerHTML = `<button type="submit" class="btn btn-primary">Submit day</button>`;
  form.appendChild(actions);

  panel.appendChild(form);
  bindYesNo(panel);
  bindStars(panel);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const record = readFormValues(form);
    if (!record.date) return;
    paLog = paLog.filter((row) => row.date !== record.date);
    paLog.push(record);
    await savePaLog();
    refreshDashboard(form.closest(".pa-view"));
  });

  form.querySelector('[name="date"]').addEventListener("change", () => {
    fillForm(form, getPaEntry(form.querySelector('[name="date"]').value));
    refreshDashboard(form.closest(".pa-view"));
  });

  fillForm(form, getPaEntry(paTodayISO()));
  return panel;
}

function statBlock(label, value, sub) {
  return `<div class="pa-stat"><span class="pa-stat-label">${label}</span><span class="pa-stat-value">${value}</span>${sub ? `<span class="pa-stat-sub">${sub}</span>` : ""}</div>`;
}

function starsDisplay(val) {
  if (!val) return "—";
  return "★".repeat(Number(val)) + "☆".repeat(5 - Number(val));
}

function sparklineBars(entries, key) {
  const vals = entries.map((e) => Number(e[key]) || 0);
  const max = Math.max(...vals, 1);
  return vals
    .map((v) => `<span class="pa-bar" style="height:${Math.max(4, (v / max) * 100)}%" title="${v}"></span>`)
    .join("");
}

function renderDashboard(panel) {
  panel.innerHTML = "";

  const heading = document.createElement("h2");
  heading.className = "pa-heading";
  heading.textContent = "Performance";
  panel.appendChild(heading);

  const selectedISO = document.querySelector("#pa-form [name=date]")?.value || paTodayISO();
  const todayEntry = getPaEntry(selectedISO);
  const recent = entriesInRange(14);
  const week = entriesInRange(7);

  const todaySec = document.createElement("section");
  todaySec.className = "pa-dash-section";
  todaySec.innerHTML = `<span class="field-label">Selected day — ${formatMDY(selectedISO)}</span>`;

  if (!todayEntry) {
    todaySec.insertAdjacentHTML("beforeend", `<p class="pa-empty">No entry for this date yet.</p>`);
  } else {
    const grid = document.createElement("div");
    grid.className = "pa-stat-grid";
    grid.innerHTML = [
      statBlock("Work (min)", totalWorkMin(todayEntry), `City Prophet ${todayEntry.workCityProphet || 0}m`),
      statBlock("Run (km)", todayEntry.healthRun || "—", todayEntry.healthWorkout === "yes" ? "Workout yes" : "Workout no"),
      statBlock("Sleep", todayEntry.healthSleepDur ? `${todayEntry.healthSleepDur}h` : "—", `Score ${todayEntry.healthSleepScore || "—"}`),
      statBlock("Screentime", todayEntry.metricsScreen ? `${todayEntry.metricsScreen}m` : "—", `Reading ${todayEntry.metricsReading || 0}m`),
      statBlock("Growth", starsDisplay(todayEntry.workGrowth), starsDisplay(todayEntry.healthMental)),
      statBlock("Spending", totalSpend(todayEntry).toFixed(2), `Invest ${todayEntry.finInvestment || 0}`),
    ].join("");
    todaySec.appendChild(grid);

    const routines = ["nightClean", "nightBrush", "nightReady"].filter((k) => todayEntry[k] === "yes").length;
    todaySec.insertAdjacentHTML("beforeend", `<p class="pa-meta">Night routine ${routines}/3 · Social ${starsDisplay(todayEntry.healthSocial)} · Brenna ${starsDisplay(todayEntry.healthBrenna)}</p>`);
    if (todayEntry.workNotes) {
      const p = document.createElement("p");
      p.className = "pa-meta";
      p.textContent = `Work notes: ${todayEntry.workNotes}`;
      todaySec.appendChild(p);
    }
    if (todayEntry.magickReflection) {
      const p = document.createElement("p");
      p.className = "pa-meta";
      p.textContent = `Magick: ${todayEntry.magickReflection}`;
      todaySec.appendChild(p);
    }
  }
  panel.appendChild(todaySec);

  const trendSec = document.createElement("section");
  trendSec.className = "pa-dash-section";
  trendSec.innerHTML = `<span class="field-label">7-day patterns</span>`;

  if (week.length < 2) {
    trendSec.insertAdjacentHTML("beforeend", `<p class="pa-empty">Log more days to see trends.</p>`);
  } else {
    const trends = document.createElement("div");
    trends.className = "pa-trends";
    PA_TREND_NUMERIC.forEach(({ key, label }) => {
      const a = avg(week, key);
      if (a == null) return;
      trends.insertAdjacentHTML(
        "beforeend",
        `<div class="pa-trend-row"><span>${label}</span><span class="pa-trend-avg">avg ${a.toFixed(1)}</span><div class="pa-sparkline">${sparklineBars(week, key)}</div></div>`
      );
    });
    PA_TREND_STARS.forEach(({ key, label }) => {
      const a = avg(week, key);
      if (a == null) return;
      trends.insertAdjacentHTML(
        "beforeend",
        `<div class="pa-trend-row"><span>${label}</span><span class="pa-trend-avg">avg ${a.toFixed(1)}★</span><div class="pa-sparkline pa-sparkline-stars">${sparklineBars(week, key)}</div></div>`
      );
    });
    const workout = yesRate(week, "healthWorkout");
    const nightRates = ["nightClean", "nightBrush", "nightReady"].map((k) => yesRate(week, k)).filter((r) => r != null);
    const night = nightRates.length ? nightRates.reduce((a, b) => a + b, 0) / nightRates.length : null;
    if (workout != null) {
      trends.insertAdjacentHTML("beforeend", `<div class="pa-trend-row"><span>Workout rate</span><span class="pa-trend-avg">${Math.round(workout * 100)}%</span></div>`);
    }
    if (night != null) {
      trends.insertAdjacentHTML("beforeend", `<div class="pa-trend-row"><span>Night routine</span><span class="pa-trend-avg">${Math.round(night * 100)}%</span></div>`);
    }
    trendSec.appendChild(trends);
  }
  panel.appendChild(trendSec);

  const sheetSec = document.createElement("section");
  sheetSec.className = "pa-dash-section pa-sheet-section";
  sheetSec.innerHTML = `<span class="field-label">Recent sheet</span>`;
  const tableWrap = document.createElement("div");
  tableWrap.className = "pa-sheet-wrap";
  const rows = sortedPaLog().slice(-8).reverse();
  if (!rows.length) {
    tableWrap.innerHTML = `<p class="pa-empty">No rows yet.</p>`;
  } else {
    const cols = ["date", "workBdci", "healthRun", "healthSleepDur", "metricsScreen", "workGrowth", "finEssential"];
    const labels = { date: "Date", workBdci: "BDCI", healthRun: "Run", healthSleepDur: "Sleep", metricsScreen: "Screen", workGrowth: "Growth", finEssential: "Spend E" };
    tableWrap.innerHTML = `<table class="pa-sheet"><thead><tr>${cols.map((c) => `<th>${labels[c]}</th>`).join("")}</tr></thead><tbody>${rows
      .map(
        (r) =>
          `<tr>${cols
            .map((c) => `<td>${c === "date" ? formatMDY(r.date) : r[c] ?? ""}</td>`)
            .join("")}</tr>`
      )
      .join("")}</tbody></table>`;
  }
  sheetSec.appendChild(tableWrap);
  panel.appendChild(sheetSec);
}

function refreshDashboard(root) {
  const dash = (root || document).querySelector(".pa-dashboard");
  if (dash) renderDashboard(dash);
}

function renderAdvancementView(container) {
  const wrap = document.createElement("div");
  wrap.className = "pa-view";

  const astroCol = createMoonTransitPlaceholder();
  astroCol.classList.add("pa-col", "pa-col-astro");

  const perfCol = document.createElement("div");
  perfCol.className = "pa-col pa-col-performance";
  const dash = document.createElement("div");
  dash.className = "pa-dashboard";
  perfCol.appendChild(dash);

  const advCol = document.createElement("div");
  advCol.className = "pa-col pa-col-advancement";
  advCol.appendChild(buildFormPanel());

  wrap.appendChild(astroCol);
  wrap.appendChild(perfCol);
  wrap.appendChild(advCol);

  container.appendChild(wrap);
  renderDashboard(dash);
  mountMoonWheel(astroCol);
}

async function initApp() {
  clearLegacyData();
  paLog = await loadPaLog();
  const container = document.getElementById("app-container");
  document.getElementById("btn-export")?.addEventListener("click", exportPaCsv);
  renderAdvancementView(container);
}

document.addEventListener("DOMContentLoaded", initApp);
