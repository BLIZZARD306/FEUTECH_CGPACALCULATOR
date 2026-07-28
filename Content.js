(() => {
  const COL_UNITS = 3;
  const COL_FINAL = 5;
  const STORAGE_KEY = "feutech_cgpa_terms";

  // ── Persistence ──────────────────────────────────────────
  function saveTerms() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(loadedTerms)); } catch (e) {}
  }
  function loadTerms() {
    try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : []; }(() => {
  const COL_UNITS = 3;
  const COL_FINAL = 5;
  const STORAGE_KEY = "feutech_cgpa_terms";

  // ── Persistence ──────────────────────────────────────────
  function saveTerms() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(loadedTerms)); } catch (e) {}
  }
  function loadTerms() {
    try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : []; } catch (e) { return []; }
  }

  // ── Grading logic ─────────────────────────────────────────
  const SKIP_VALUES = new Set([0.0, 6.0, 7.0, 8.0, 9.0]);

  function parseGradePoint(raw) {
    const trimmed = raw.trim();
    if (!trimmed || trimmed === "-") return null;
    const n = parseFloat(trimmed);
    if (isNaN(n)) return null;
    if (SKIP_VALUES.has(n)) return null;
    const valid = [4.0, 3.5, 3.0, 2.5, 2.0, 1.5, 1.0, 0.5];
    for (const v of valid) { if (Math.abs(n - v) < 0.05) return v; }
    return null;
  }

  function getLetterGrade(gp) {
    if (gp >= 4.0) return "A";
    if (gp >= 3.5) return "A−";
    if (gp >= 3.0) return "B+";
    if (gp >= 2.5) return "B";
    if (gp >= 2.0) return "B−";
    if (gp >= 1.5) return "C";
    if (gp >= 1.0) return "D";
    return "E";
  }

  function getStanding(qpa) {
    if (qpa >= 3.75) return { label: "First Honors — Dean's List", color: "#8B6914" };
    if (qpa >= 3.00) return { label: "Second Honors — Dean's List", color: "#1a6b3c" };
    if (qpa >= 2.00) return { label: "Good Standing", color: "#1a5e20" };
    if (qpa >= 1.00) return { label: "Passing", color: "#b06000" };
    return { label: "At Risk", color: "#c00020" };
  }

  function scrapeCurrentTable() {
    const rows = document.querySelectorAll("table tbody tr");
    const entries = [];
    for (const tr of rows) {
      const cells = tr.querySelectorAll("td");
      if (cells.length <= COL_FINAL) continue;
      const gp = parseGradePoint(cells[COL_FINAL].textContent);
      const units = parseFloat(cells[COL_UNITS].textContent.trim());
      if (gp !== null && !isNaN(units) && units > 0) {
        entries.push({ gp, units });
      }
    }
    return entries;
  }

  function computeQPA(entries) {
    if (!entries.length) return null;
    let totalGP = 0, totalUnits = 0;
    for (const e of entries) { totalGP += e.gp * e.units; totalUnits += e.units; }
    return { qpa: totalGP / totalUnits, totalUnits, count: entries.length };
  }

  function getCurrentTermLabel() {
    const sel = document.querySelector("select");
    if (!sel) return "Unknown Term";
    return sel.options[sel.selectedIndex]?.text?.trim() || "Unknown Term";
  }

  // ── State ────────────────────────────────────────────────
  let loadedTerms = loadTerms();

  // ── Reopen button (shown after widget is closed) ─────────
  function showReopenButton() {
    document.getElementById("feu-cgpa-widget")?.remove();

    const btn = document.createElement("button");
    btn.id = "feu-cgpa-reopen";
    btn.title = "Open CGPA Calculator";
    btn.innerHTML = `
      <style>
        #feu-cgpa-reopen {
          position:fixed;bottom:20px;right:20px;
          width:44px;height:44px;border-radius:50%;
          background:#1a5e20;color:#fff;border:none;
          font-size:20px;cursor:pointer;z-index:999999;
          box-shadow:0 3px 12px rgba(0,0,0,0.25);
          display:flex;align-items:center;justify-content:center;
        }
        #feu-cgpa-reopen:hover { background:#145218; }
      </style>
      📊
    `;
    btn.addEventListener("click", () => {
      btn.remove();
      initWidget();
    });
    document.body.appendChild(btn);
  }

  // ── Widget ───────────────────────────────────────────────
  function renderWidget() {
    const all = loadedTerms.flatMap(t => t.entries);
    const result = computeQPA(all);
    const qpaDisp = result ? result.qpa.toFixed(2) : "—";
    const qpaExact = result ? result.qpa.toFixed(4) : "—";
    const letter = result ? getLetterGrade(result.qpa) : "—";
    const units = result ? result.totalUnits : 0;
    const count = result ? result.count : 0;
    const standing = result ? getStanding(result.qpa) : { label: "No terms loaded", color: "#999" };

    const termRows = loadedTerms.map((t, i) => {
      const tu = t.entries.reduce((s, e) => s + e.units, 0);
      const tRes = computeQPA(t.entries);
      const tLetter = tRes ? getLetterGrade(tRes.qpa) : "—";
      return `
        <div style="display:flex;justify-content:space-between;align-items:center;
                    background:#f0f4f0;border-radius:6px;padding:5px 8px;margin-bottom:4px;">
          <div style="flex:1;min-width:0;margin-right:6px">
            <div style="font-size:11px;font-weight:600;color:#1a5e20;
                        white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${t.label}</div>
            <div style="font-size:10px;color:#666;margin-top:1px">
              ${t.entries.length} subj · ${tu} units · GPA ${tRes ? tRes.qpa.toFixed(2) : "—"} (${tLetter})
            </div>
          </div>
          <button data-remove="${i}"
            style="background:none;border:none;color:#c00020;cursor:pointer;
                   font-size:17px;line-height:1;padding:0;flex-shrink:0"
            title="Remove this term">×</button>
        </div>`;
    }).join("");

    document.getElementById("feu-cgpa-widget").innerHTML = `
      <style>
        #feu-cgpa-widget {
          position:fixed;bottom:20px;right:20px;width:245px;
          font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
          background:#fff;border-radius:12px;
          box-shadow:0 4px 24px rgba(0,0,0,0.18);
          border:1px solid rgba(0,0,0,0.08);
          overflow:hidden;z-index:999999;
        }
        #cgpa-header {
          background:#1a5e20;color:#fff;padding:11px 14px 10px;
          display:flex;justify-content:space-between;align-items:flex-start;
        }
        #cgpa-header-left { flex:1;cursor:pointer;user-select:none; }
        #cgpa-header .lbl { font-size:10px;font-weight:600;letter-spacing:.09em;text-transform:uppercase;opacity:.75 }
        #cgpa-header .val-row { display:flex;align-items:baseline;gap:8px }
        #cgpa-header .val { font-size:30px;font-weight:700;line-height:1.1;letter-spacing:-.5px }
        #cgpa-header .letter { font-size:16px;font-weight:600;opacity:.85 }
        #cgpa-header .sub { font-size:10px;opacity:.6;margin-top:2px }
        #cgpa-header-btns { display:flex;flex-direction:column;align-items:flex-end;gap:4px;margin-left:8px; }
        .hdr-btn {
          background:rgba(255,255,255,0.15);border:none;color:#fff;
          cursor:pointer;border-radius:4px;width:22px;height:22px;
          display:flex;align-items:center;justify-content:center;
          font-size:13px;line-height:1;padding:0;
        }
        .hdr-btn:hover { background:rgba(255,255,255,0.28); }
        #cgpa-body { padding:10px 13px 13px;background:#fafafa }
        .c-row { display:flex;justify-content:space-between;font-size:12px;padding:4px 0;border-bottom:1px solid #eee }
        .c-row .l { color:#777 }
        .c-row .v { font-weight:600;color:#222 }
        #cgpa-standing {
          margin:8px 0;text-align:center;font-size:11px;font-weight:700;
          letter-spacing:.03em;padding:5px 8px;border-radius:6px;background:#f0f0f0;
        }
        #cgpa-terms-hdr {
          font-size:10px;font-weight:600;color:#888;letter-spacing:.07em;
          text-transform:uppercase;margin:0 0 6px;
        }
        .cgpa-btn {
          width:100%;padding:7px 0;border:none;border-radius:7px;
          font-size:11px;font-weight:600;cursor:pointer;letter-spacing:.03em;margin-top:5px;
        }
        #cgpa-add-btn { background:#1a5e20;color:#fff }
        #cgpa-add-btn:hover { background:#145218 }
        #cgpa-clear-btn { background:#f0f0f0;color:#c00020 }
        #cgpa-clear-btn:hover { background:#fde8e8 }
        #cgpa-note { font-size:10px;color:#aaa;margin:8px 0 0;text-align:center;line-height:1.5 }
      </style>

      <div id="cgpa-header">
        <div id="cgpa-header-left">
          <div class="lbl">Cumulative GPA</div>
          <div class="val-row">
            <span class="val">${qpaDisp}</span>
            <span class="letter">${letter}</span>
          </div>
          <div class="sub">Exact: ${qpaExact} &nbsp;·&nbsp; Scale: 0.5 – 4.0</div>
        </div>
        <div id="cgpa-header-btns">
          <button class="hdr-btn" id="cgpa-collapse-btn" title="Collapse">▾</button>
          <button class="hdr-btn" id="cgpa-close-btn"    title="Close">✕</button>
        </div>
      </div>

      <div id="cgpa-body">
        <div class="c-row"><span class="l">Total subjects</span><span class="v">${count}</span></div>
        <div class="c-row"><span class="l">Total units</span><span class="v">${units}</span></div>
        <div id="cgpa-standing" style="color:${standing.color}">${standing.label}</div>

        <div id="cgpa-terms-hdr">Loaded terms (${loadedTerms.length})</div>
        <div id="cgpa-terms-list">
          ${loadedTerms.length
            ? termRows
            : '<div style="font-size:11px;color:#aaa;text-align:center;padding:2px 0 6px">No terms added yet</div>'}
        </div>

        <button class="cgpa-btn" id="cgpa-add-btn">＋ Add current term</button>
        <button class="cgpa-btn" id="cgpa-clear-btn">✕ Clear all terms</button>
        <p id="cgpa-note">
          Pick a term → Submit → "Add current term".<br>
          Data is saved and survives page refreshes.<br>
          Dropped, INC, and NSTP grades are excluded.
        </p>
      </div>
    `;

    document.getElementById("cgpa-header-left").addEventListener("click", () => {
      const body = document.getElementById("cgpa-body");
      const btn = document.getElementById("cgpa-collapse-btn");
      const isCollapsed = body.style.display === "none";
      body.style.display = isCollapsed ? "" : "none";
      btn.textContent = isCollapsed ? "▾" : "▸";
    });

    document.getElementById("cgpa-collapse-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      const body = document.getElementById("cgpa-body");
      const btn = document.getElementById("cgpa-collapse-btn");
      const isCollapsed = body.style.display === "none";
      body.style.display = isCollapsed ? "" : "none";
      btn.textContent = isCollapsed ? "▾" : "▸";
    });

    document.getElementById("cgpa-close-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      showReopenButton();
    });

    document.getElementById("cgpa-add-btn").addEventListener("click", () => {
      const entries = scrapeCurrentTable();
      if (!entries.length) {
        alert("No valid grades found.\nSelect a term, click Submit, and wait for the table to load.");
        return;
      }
      const label = getCurrentTermLabel();
      const dupIdx = loadedTerms.findIndex(t => t.label === label);
      if (dupIdx !== -1) {
        if (!confirm(`"${label}" is already loaded.\nReplace it with the current data?`)) return;
        loadedTerms.splice(dupIdx, 1);
      }
      loadedTerms.push({ label, entries });
      saveTerms();
      renderWidget();
    });

    document.getElementById("cgpa-clear-btn").addEventListener("click", () => {
      if (!loadedTerms.length) return;
      if (confirm("Remove all loaded terms and reset your CGPA?")) {
        loadedTerms = [];
        saveTerms();
        renderWidget();
      }
    });

    document.querySelectorAll("[data-remove]").forEach(btn => {
      btn.addEventListener("click", e => {
        loadedTerms.splice(parseInt(e.currentTarget.dataset.remove), 1);
        saveTerms();
        renderWidget();
      });
    });
  }

  function initWidget() {
    if (document.getElementById("feu-cgpa-widget")) return;
    const widget = document.createElement("div");
    widget.id = "feu-cgpa-widget";
    document.body.appendChild(widget);
    renderWidget();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => setTimeout(initWidget, 800));
  } else {
    setTimeout(initWidget, 800);
  }
})(); catch (e) { return []; }
  }

  // ── Grading logic ─────────────────────────────────────────
  const SKIP_VALUES = new Set([0.0, 6.0, 7.0, 8.0, 9.0]);

  function parseGradePoint(raw) {
    const trimmed = raw.trim();
    if (!trimmed || trimmed === "-") return null;
    const n = parseFloat(trimmed);
    if (isNaN(n)) return null;
    if (SKIP_VALUES.has(n)) return null;
    const valid = [4.0, 3.5, 3.0, 2.5, 2.0, 1.5, 1.0, 0.5];
    for (const v of valid) { if (Math.abs(n - v) < 0.05) return v; }
    return null;
  }

  function getLetterGrade(gp) {
    if (gp >= 4.0) return "A";
    if (gp >= 3.5) return "A−";
    if (gp >= 3.0) return "B+";
    if (gp >= 2.5) return "B";(() => {
  const COL_UNITS = 3;
  const COL_FINAL = 5;
  const STORAGE_KEY = "feutech_cgpa_terms";

  // ── Persistence ──────────────────────────────────────────
  function saveTerms() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(loadedTerms)); } catch (e) {}
  }
  function loadTerms() {
    try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : []; } catch (e) { return []; }
  }

  // ── Grading logic ─────────────────────────────────────────
  const SKIP_VALUES = new Set([0.0, 6.0, 7.0, 8.0, 9.0]);

  function parseGradePoint(raw) {
    const trimmed = raw.trim();
    if (!trimmed || trimmed === "-") return null;
    const n = parseFloat(trimmed);
    if (isNaN(n)) return null;
    if (SKIP_VALUES.has(n)) return null;
    const valid = [4.0, 3.5, 3.0, 2.5, 2.0, 1.5, 1.0, 0.5];
    for (const v of valid) { if (Math.abs(n - v) < 0.05) return v; }
    return null;
  }

  function getLetterGrade(gp) {
    if (gp >= 4.0) return "A";
    if (gp >= 3.5) return "A−";
    if (gp >= 3.0) return "B+";
    if (gp >= 2.5) return "B";
    if (gp >= 2.0) return "B−";
    if (gp >= 1.5) return "C";
    if (gp >= 1.0) return "D";
    return "E";
  }

  function getStanding(qpa) {
    if (qpa >= 3.51) return { label: "First Honors — Dean's List",  color: "#8B6914" };
    if (qpa >= 3.35) return { label: "Second Honors — Dean's List", color: "#1a6b3c" };
    if (qpa >= 2.00) return { label: "Good Standing",               color: "#1a5e20" };
    if (qpa >= 1.00) return { label: "Passing",                     color: "#b06000" };
    return                  { label: "At Risk",                     color: "#c00020" };
  }

  function scrapeCurrentTable() {
    const rows = document.querySelectorAll("table tbody tr");
    const entries = [];
    for (const tr of rows) {
      const cells = tr.querySelectorAll("td");
      if (cells.length <= COL_FINAL) continue;
      const gp    = parseGradePoint(cells[COL_FINAL].textContent);
      const units = parseFloat(cells[COL_UNITS].textContent.trim());
      if (gp !== null && !isNaN(units) && units > 0) {
        entries.push({ gp, units });
      }
    }
    return entries;
  }

  function computeQPA(entries) {
    if (!entries.length) return null;
    let totalGP = 0, totalUnits = 0;
    for (const e of entries) { totalGP += e.gp * e.units; totalUnits += e.units; }
    return { qpa: totalGP / totalUnits, totalUnits, count: entries.length };
  }

  function getCurrentTermLabel() {
    const sel = document.querySelector("select");
    if (!sel) return "Unknown Term";
    return sel.options[sel.selectedIndex]?.text?.trim() || "Unknown Term";
  }

  // ── State ────────────────────────────────────────────────
  let loadedTerms = loadTerms();

  // ── Reopen button (shown after widget is closed) ─────────
  function showReopenButton() {
    document.getElementById("feu-cgpa-widget")?.remove();

    const btn = document.createElement("button");
    btn.id = "feu-cgpa-reopen";
    btn.title = "Open CGPA Calculator";
    btn.innerHTML = `
      <style>
        #feu-cgpa-reopen {
          position:fixed;bottom:20px;right:20px;
          width:44px;height:44px;border-radius:50%;
          background:#1a5e20;color:#fff;border:none;
          font-size:20px;cursor:pointer;z-index:999999;
          box-shadow:0 3px 12px rgba(0,0,0,0.25);
          display:flex;align-items:center;justify-content:center;
        }
        #feu-cgpa-reopen:hover { background:#145218; }
      </style>
      📊
    `;
    btn.addEventListener("click", () => {
      btn.remove();
      initWidget();
    });
    document.body.appendChild(btn);
  }

  // ── Widget ───────────────────────────────────────────────
  function renderWidget() {
    const all      = loadedTerms.flatMap(t => t.entries);
    const result   = computeQPA(all);
    const qpaDisp  = result ? result.qpa.toFixed(2)  : "—";
    const qpaExact = result ? result.qpa.toFixed(4)  : "—";
    const letter   = result ? getLetterGrade(result.qpa) : "—";
    const units    = result ? result.totalUnits : 0;
    const count    = result ? result.count : 0;
    const standing = result ? getStanding(result.qpa) : { label: "No terms loaded", color: "#999" };

    const termRows = loadedTerms.map((t, i) => {
      const tu      = t.entries.reduce((s, e) => s + e.units, 0);
      const tRes    = computeQPA(t.entries);
      const tLetter = tRes ? getLetterGrade(tRes.qpa) : "—";
      return `
        <div style="display:flex;justify-content:space-between;align-items:center;
                    background:#f0f4f0;border-radius:6px;padding:5px 8px;margin-bottom:4px;">
          <div style="flex:1;min-width:0;margin-right:6px">
            <div style="font-size:11px;font-weight:600;color:#1a5e20;
                        white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${t.label}</div>
            <div style="font-size:10px;color:#666;margin-top:1px">
              ${t.entries.length} subj · ${tu} units · GPA ${tRes ? tRes.qpa.toFixed(2) : "—"} (${tLetter})
            </div>
          </div>
          <button data-remove="${i}"
            style="background:none;border:none;color:#c00020;cursor:pointer;
                   font-size:17px;line-height:1;padding:0;flex-shrink:0"
            title="Remove this term">×</button>
        </div>`;
    }).join("");

    document.getElementById("feu-cgpa-widget").innerHTML = `
      <style>
        #feu-cgpa-widget {
          position:fixed;bottom:20px;right:20px;width:245px;
          font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
          background:#fff;border-radius:12px;
          box-shadow:0 4px 24px rgba(0,0,0,0.18);
          border:1px solid rgba(0,0,0,0.08);
          overflow:hidden;z-index:999999;
        }
        #cgpa-header {
          background:#1a5e20;color:#fff;padding:11px 14px 10px;
          display:flex;justify-content:space-between;align-items:flex-start;
        }
        #cgpa-header-left { flex:1;cursor:pointer;user-select:none; }
        #cgpa-header .lbl { font-size:10px;font-weight:600;letter-spacing:.09em;text-transform:uppercase;opacity:.75 }
        #cgpa-header .val-row { display:flex;align-items:baseline;gap:8px }
        #cgpa-header .val { font-size:30px;font-weight:700;line-height:1.1;letter-spacing:-.5px }
        #cgpa-header .letter { font-size:16px;font-weight:600;opacity:.85 }
        #cgpa-header .sub { font-size:10px;opacity:.6;margin-top:2px }
        #cgpa-header-btns { display:flex;flex-direction:column;align-items:flex-end;gap:4px;margin-left:8px; }
        .hdr-btn {
          background:rgba(255,255,255,0.15);border:none;color:#fff;
          cursor:pointer;border-radius:4px;width:22px;height:22px;
          display:flex;align-items:center;justify-content:center;
          font-size:13px;line-height:1;padding:0;
        }
        .hdr-btn:hover { background:rgba(255,255,255,0.28); }
        #cgpa-body { padding:10px 13px 13px;background:#fafafa }
        .c-row { display:flex;justify-content:space-between;font-size:12px;padding:4px 0;border-bottom:1px solid #eee }
        .c-row .l { color:#777 }
        .c-row .v { font-weight:600;color:#222 }
        #cgpa-standing {
          margin:8px 0;text-align:center;font-size:11px;font-weight:700;
          letter-spacing:.03em;padding:5px 8px;border-radius:6px;background:#f0f0f0;
        }
        #cgpa-terms-hdr {
          font-size:10px;font-weight:600;color:#888;letter-spacing:.07em;
          text-transform:uppercase;margin:0 0 6px;
        }
        .cgpa-btn {
          width:100%;padding:7px 0;border:none;border-radius:7px;
          font-size:11px;font-weight:600;cursor:pointer;letter-spacing:.03em;margin-top:5px;
        }
        #cgpa-add-btn { background:#1a5e20;color:#fff }
        #cgpa-add-btn:hover { background:#145218 }
        #cgpa-clear-btn { background:#f0f0f0;color:#c00020 }
        #cgpa-clear-btn:hover { background:#fde8e8 }
        #cgpa-note { font-size:10px;color:#aaa;margin:8px 0 0;text-align:center;line-height:1.5 }
      </style>

      <div id="cgpa-header">
        <div id="cgpa-header-left">
          <div class="lbl">Cumulative GPA</div>
          <div class="val-row">
            <span class="val">${qpaDisp}</span>
            <span class="letter">${letter}</span>
          </div>
          <div class="sub">Exact: ${qpaExact} &nbsp;·&nbsp; Scale: 0.5 – 4.0</div>
        </div>
        <div id="cgpa-header-btns">
          <button class="hdr-btn" id="cgpa-collapse-btn" title="Collapse">▾</button>
          <button class="hdr-btn" id="cgpa-close-btn"    title="Close">✕</button>
        </div>
      </div>

      <div id="cgpa-body">
        <div class="c-row"><span class="l">Total subjects</span><span class="v">${count}</span></div>
        <div class="c-row"><span class="l">Total units</span><span class="v">${units}</span></div>
        <div id="cgpa-standing" style="color:${standing.color}">${standing.label}</div>

        <div id="cgpa-terms-hdr">Loaded terms (${loadedTerms.length})</div>
        <div id="cgpa-terms-list">
          ${loadedTerms.length
            ? termRows
            : '<div style="font-size:11px;color:#aaa;text-align:center;padding:2px 0 6px">No terms added yet</div>'}
        </div>

        <button class="cgpa-btn" id="cgpa-add-btn">＋ Add current term</button>
        <button class="cgpa-btn" id="cgpa-clear-btn">✕ Clear all terms</button>
        <p id="cgpa-note">
          Pick a term → Submit → "Add current term".<br>
          Data is saved and survives page refreshes.<br>
          Dropped, INC, and NSTP grades are excluded.
        </p>
      </div>
    `;

    // Collapse / expand (clicking the left side of the header)
    document.getElementById("cgpa-header-left").addEventListener("click", () => {
      const body = document.getElementById("cgpa-body");
      const btn  = document.getElementById("cgpa-collapse-btn");
      const isCollapsed = body.style.display === "none";
      body.style.display = isCollapsed ? "" : "none";
      btn.textContent    = isCollapsed ? "▾" : "▸";
    });

    // Collapse button
    document.getElementById("cgpa-collapse-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      const body = document.getElementById("cgpa-body");
      const btn  = document.getElementById("cgpa-collapse-btn");
      const isCollapsed = body.style.display === "none";
      body.style.display = isCollapsed ? "" : "none";
      btn.textContent    = isCollapsed ? "▾" : "▸";
    });

    // Close / exit button — hides widget, shows reopen button
    document.getElementById("cgpa-close-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      showReopenButton();
    });

    // Add current term
    document.getElementById("cgpa-add-btn").addEventListener("click", () => {
      const entries = scrapeCurrentTable();
      if (!entries.length) {
        alert("No valid grades found.\nSelect a term, click Submit, and wait for the table to load.");
        return;
      }
      const label  = getCurrentTermLabel();
          const dupIdx = loadedTerms.findIndex(t => t.label === label);
      if (dupIdx !== -1) {
        if (!confirm(`"${label}" is already loaded.\nReplace it with the current data?`)) return;
        loadedTerms.splice(dupIdx, 1);
      }
      loadedTerms.push({ label, entries });
      saveTerms();
      renderWidget();
    });

    // Clear all
    document.getElementById("cgpa-clear-btn").addEventListener("click", () => {
      if (!loadedTerms.length) return;
      if (confirm("Remove all loaded terms and reset your CGPA?")) {
        loadedTerms = [];
        saveTerms();
        renderWidget();
      }
    });

    // Remove individual term
    document.querySelectorAll("[data-remove]").forEach(btn => {
      btn.addEventListener("click", e => {
        loadedTerms.splice(parseInt(e.currentTarget.dataset.remove), 1);
        saveTerms();
        renderWidget();
      });
    });
  }

  function initWidget() {
    if (document.getElementById("feu-cgpa-widget")) return;
    const widget = document.createElement("div");
    widget.id = "feu-cgpa-widget";
    document.body.appendChild(widget);
    renderWidget();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => setTimeout(initWidget, 800));
  } else {
    setTimeout(initWidget, 800);
  }
})();

    if (gp >= 2.0) return "B−";
    if (gp >= 1.5) return "C";
    if (gp >= 1.0) return "D";
    return "E";
  }

  function getStanding(qpa) {
    if (qpa >= 3.75) return { label: "First Honors — Dean's List",  color: "#8B6914" };
    if (qpa >= 3.00) return { label: "Second Honors — Dean's List", color: "#1a6b3c" };
    if (qpa >= 2.00) return { label: "Good Standing",               color: "#1a5e20" };
    if (qpa >= 1.00) return { label: "Passing",                     color: "#b06000" };
    return                  { label: "At Risk",                     color: "#c00020" };
  }

  function scrapeCurrentTable() {
    const rows = document.querySelectorAll("table tbody tr");
    const entries = [];
    for (const tr of rows) {
      const cells = tr.querySelectorAll("td");
      if (cells.length <= COL_FINAL) continue;
      const gp    = parseGradePoint(cells[COL_FINAL].textContent);
      const units = parseFloat(cells[COL_UNITS].textContent.trim());
      if (gp !== null && !isNaN(units) && units > 0) {
        entries.push({ gp, units });
      }
    }
    return entries;
  }

  function computeQPA(entries) {
    if (!entries.length) return null;
    let totalGP = 0, totalUnits = 0;
    for (const e of entries) { totalGP += e.gp * e.units; totalUnits += e.units; }
    return { qpa: totalGP / totalUnits, totalUnits, count: entries.length };
  }

  function getCurrentTermLabel() {
    const sel = document.querySelector("select");
    if (!sel) return "Unknown Term";
    return sel.options[sel.selectedIndex]?.text?.trim() || "Unknown Term";
  }

  // ── State ────────────────────────────────────────────────
  let loadedTerms = loadTerms();

  // ── Reopen button (shown after widget is closed) ─────────
  function showReopenButton() {
    document.getElementById("feu-cgpa-widget")?.remove();

    const btn = document.createElement("button");
    btn.id = "feu-cgpa-reopen";
    btn.title = "Open CGPA Calculator";
    btn.innerHTML = `
      <style>
        #feu-cgpa-reopen {
          position:fixed;bottom:20px;right:20px;
          width:44px;height:44px;border-radius:50%;
          background:#1a5e20;color:#fff;border:none;
          font-size:20px;cursor:pointer;z-index:999999;
          box-shadow:0 3px 12px rgba(0,0,0,0.25);
          display:flex;align-items:center;justify-content:center;
        }
        #feu-cgpa-reopen:hover { background:#145218; }
      </style>
      📊
    `;
    btn.addEventListener("click", () => {
      btn.remove();
      initWidget();
    });
    document.body.appendChild(btn);
  }

  // ── Widget ───────────────────────────────────────────────
  function renderWidget() {
    const all      = loadedTerms.flatMap(t => t.entries);
    const result   = computeQPA(all);
    const qpaDisp  = result ? result.qpa.toFixed(2)  : "—";
    const qpaExact = result ? result.qpa.toFixed(4)  : "—";
    const letter   = result ? getLetterGrade(result.qpa) : "—";
    const units    = result ? result.totalUnits : 0;
    const count    = result ? result.count : 0;
    const standing = result ? getStanding(result.qpa) : { label: "No terms loaded", color: "#999" };

    const termRows = loadedTerms.map((t, i) => {
      const tu      = t.entries.reduce((s, e) => s + e.units, 0);
      const tRes    = computeQPA(t.entries);
      const tLetter = tRes ? getLetterGrade(tRes.qpa) : "—";
      return `
        <div style="display:flex;justify-content:space-between;align-items:center;
                    background:#f0f4f0;border-radius:6px;padding:5px 8px;margin-bottom:4px;">
          <div style="flex:1;min-width:0;margin-right:6px">
            <div style="font-size:11px;font-weight:600;color:#1a5e20;
                        white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${t.label}</div>
            <div style="font-size:10px;color:#666;margin-top:1px">
              ${t.entries.length} subj · ${tu} units · GPA ${tRes ? tRes.qpa.toFixed(2) : "—"} (${tLetter})
            </div>
          </div>
          <button data-remove="${i}"
            style="background:none;border:none;color:#c00020;cursor:pointer;
                   font-size:17px;line-height:1;padding:0;flex-shrink:0"
            title="Remove this term">×</button>
        </div>`;
    }).join("");

    document.getElementById("feu-cgpa-widget").innerHTML = `
      <style>
        #feu-cgpa-widget {
          position:fixed;bottom:20px;right:20px;width:245px;
          font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
          background:#fff;border-radius:12px;
          box-shadow:0 4px 24px rgba(0,0,0,0.18);
          border:1px solid rgba(0,0,0,0.08);
          overflow:hidden;z-index:999999;
        }
        #cgpa-header {
          background:#1a5e20;color:#fff;padding:11px 14px 10px;
          display:flex;justify-content:space-between;align-items:flex-start;
        }
        #cgpa-header-left { flex:1;cursor:pointer;user-select:none; }
        #cgpa-header .lbl { font-size:10px;font-weight:600;letter-spacing:.09em;text-transform:uppercase;opacity:.75 }
        #cgpa-header .val-row { display:flex;align-items:baseline;gap:8px }
        #cgpa-header .val { font-size:30px;font-weight:700;line-height:1.1;letter-spacing:-.5px }
        #cgpa-header .letter { font-size:16px;font-weight:600;opacity:.85 }
        #cgpa-header .sub { font-size:10px;opacity:.6;margin-top:2px }
        #cgpa-header-btns { display:flex;flex-direction:column;align-items:flex-end;gap:4px;margin-left:8px; }
        .hdr-btn {
          background:rgba(255,255,255,0.15);border:none;color:#fff;
          cursor:pointer;border-radius:4px;width:22px;height:22px;
          display:flex;align-items:center;justify-content:center;
          font-size:13px;line-height:1;padding:0;
        }
        .hdr-btn:hover { background:rgba(255,255,255,0.28); }
        #cgpa-body { padding:10px 13px 13px;background:#fafafa }
        .c-row { display:flex;justify-content:space-between;font-size:12px;padding:4px 0;border-bottom:1px solid #eee }
        .c-row .l { color:#777 }
        .c-row .v { font-weight:600;color:#222 }
        #cgpa-standing {
          margin:8px 0;text-align:center;font-size:11px;font-weight:700;
          letter-spacing:.03em;padding:5px 8px;border-radius:6px;background:#f0f0f0;
        }
        #cgpa-terms-hdr {
          font-size:10px;font-weight:600;color:#888;letter-spacing:.07em;
          text-transform:uppercase;margin:0 0 6px;
        }
        .cgpa-btn {
          width:100%;padding:7px 0;border:none;border-radius:7px;
          font-size:11px;font-weight:600;cursor:pointer;letter-spacing:.03em;margin-top:5px;
        }
        #cgpa-add-btn { background:#1a5e20;color:#fff }
        #cgpa-add-btn:hover { background:#145218 }
        #cgpa-clear-btn { background:#f0f0f0;color:#c00020 }
        #cgpa-clear-btn:hover { background:#fde8e8 }
        #cgpa-note { font-size:10px;color:#aaa;margin:8px 0 0;text-align:center;line-height:1.5 }
      </style>

      <div id="cgpa-header">
        <div id="cgpa-header-left">
          <div class="lbl">Cumulative GPA</div>
          <div class="val-row">
            <span class="val">${qpaDisp}</span>
            <span class="letter">${letter}</span>
          </div>
          <div class="sub">Exact: ${qpaExact} &nbsp;·&nbsp; Scale: 0.5 – 4.0</div>
        </div>
        <div id="cgpa-header-btns">
          <button class="hdr-btn" id="cgpa-collapse-btn" title="Collapse">▾</button>
          <button class="hdr-btn" id="cgpa-close-btn"    title="Close">✕</button>
        </div>
      </div>

      <div id="cgpa-body">
        <div class="c-row"><span class="l">Total subjects</span><span class="v">${count}</span></div>
        <div class="c-row"><span class="l">Total units</span><span class="v">${units}</span></div>
        <div id="cgpa-standing" style="color:${standing.color}">${standing.label}</div>

        <div id="cgpa-terms-hdr">Loaded terms (${loadedTerms.length})</div>
        <div id="cgpa-terms-list">
          ${loadedTerms.length
            ? termRows
            : '<div style="font-size:11px;color:#aaa;text-align:center;padding:2px 0 6px">No terms added yet</div>'}
        </div>

        <button class="cgpa-btn" id="cgpa-add-btn">＋ Add current term</button>
        <button class="cgpa-btn" id="cgpa-clear-btn">✕ Clear all terms</button>
        <p id="cgpa-note">
          Pick a term → Submit → "Add current term".<br>
          Data is saved and survives page refreshes.<br>
          Dropped, INC, and NSTP grades are excluded.
        </p>
      </div>
    `;

    // Collapse / expand (clicking the left side of the header)
    document.getElementById("cgpa-header-left").addEventListener("click", () => {
      const body = document.getElementById("cgpa-body");
      const btn  = document.getElementById("cgpa-collapse-btn");
      const isCollapsed = body.style.display === "none";
      body.style.display = isCollapsed ? "" : "none";
      btn.textContent    = isCollapsed ? "▾" : "▸";
    });

    // Collapse button
    document.getElementById("cgpa-collapse-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      const body = document.getElementById("cgpa-body");
      const btn  = document.getElementById("cgpa-collapse-btn");
      const isCollapsed = body.style.display === "none";
      body.style.display = isCollapsed ? "" : "none";
      btn.textContent    = isCollapsed ? "▾" : "▸";
    });

    // Close / exit button — hides widget, shows reopen button
    document.getElementById("cgpa-close-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      showReopenButton();
    });

    // Add current term
    document.getElementById("cgpa-add-btn").addEventListener("click", () => {
      const entries = scrapeCurrentTable();
      if (!entries.length) {
        alert("No valid grades found.\nSelect a term, click Submit, and wait for the table to load.");
        return;
      }
      const label  = getCurrentTermLabel();
      const dupIdx = loadedTerms.findIndex(t => t.label === label);
      if (dupIdx !== -1) {
        if (!confirm(`"${label}" is already loaded.\nReplace it with the current data?`)) return;
        loadedTerms.splice(dupIdx, 1);
      }
      loadedTerms.push({ label, entries });
      saveTerms();
      renderWidget();
    });

    // Clear all
    document.getElementById("cgpa-clear-btn").addEventListener("click", () => {
      if (!loadedTerms.length) return;
      if (confirm("Remove all loaded terms and reset your CGPA?")) {
        loadedTerms = [];
        saveTerms();
        renderWidget();
      }
    });

    // Remove individual term
    document.querySelectorAll("[data-remove]").forEach(btn => {
      btn.addEventListener("click", e => {
        loadedTerms.splice(parseInt(e.currentTarget.dataset.remove), 1);
        saveTerms();
        renderWidget();
      });
    });
  }

  function initWidget() {
    if (document.getElementById("feu-cgpa-widget")) return;
    const widget = document.createElement("div");
    widget.id = "feu-cgpa-widget";
    document.body.appendChild(widget);
    renderWidget();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => setTimeout(initWidget, 800));
  } else {
    setTimeout(initWidget, 800);
  }
})();
