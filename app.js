/*
 * app.js
 * Wires the figure registry to the sidebar, the controls panel, the canvas,
 * and the toolbar. Per-figure control values are kept in `state.values` so
 * they persist while switching figures.
 */
(function () {
  "use strict";

  const G = window.Geo;
  const figures = window.Figures;
  const VIEW_W = 480, VIEW_H = 360;

  const els = {
    sidebar: document.getElementById("sidebar"),
    controls: document.getElementById("controls"),
    canvas: document.getElementById("canvas"),
    title: document.getElementById("figure-title"),
    desc: document.getElementById("figure-desc"),
    reset: document.getElementById("reset-figure"),
    download: document.getElementById("download-svg"),
  };

  const state = {
    currentId: null,
    values: {}, // { figureId: { controlKey: value } }
  };

  const current = () => figures.find((f) => f.id === state.currentId);

  // Resolve control values for a figure, filling in defaults where unset.
  function paramsFor(fig) {
    const stored = state.values[fig.id] || {};
    const p = {};
    (fig.controls || []).forEach((c) => {
      p[c.key] = stored[c.key] !== undefined ? stored[c.key] : c.default;
    });
    return p;
  }

  function setValue(fig, key, value) {
    if (!state.values[fig.id]) state.values[fig.id] = {};
    state.values[fig.id][key] = value;
  }

  // ----- sidebar -----
  function buildSidebar() {
    const byCategory = new Map();
    figures.forEach((f) => {
      if (!byCategory.has(f.category)) byCategory.set(f.category, []);
      byCategory.get(f.category).push(f);
    });
    byCategory.forEach((items, category) => {
      const section = document.createElement("div");
      section.className = "nav-section";
      const h = document.createElement("h3");
      h.className = "nav-heading";
      h.textContent = category;
      section.appendChild(h);
      items.forEach((f) => {
        const btn = document.createElement("button");
        btn.className = "nav-item";
        btn.type = "button";
        btn.textContent = f.name;
        btn.dataset.id = f.id;
        btn.addEventListener("click", () => select(f.id));
        section.appendChild(btn);
      });
      els.sidebar.appendChild(section);
    });
  }

  // ----- controls panel -----
  function buildControls(fig) {
    els.controls.innerHTML = "";
    const controls = fig.controls || [];
    if (!controls.length) {
      const empty = document.createElement("p");
      empty.className = "controls-empty";
      empty.textContent = "This figure has no adjustable options.";
      els.controls.appendChild(empty);
      return;
    }
    const p = paramsFor(fig);

    // group controls by their optional `group` label, preserving order
    const groups = [];
    const byName = new Map();
    controls.forEach((c) => {
      const name = c.group || "Options";
      if (!byName.has(name)) { byName.set(name, []); groups.push(name); }
      byName.get(name).push(c);
    });

    groups.forEach((name) => {
      const wrap = document.createElement("div");
      wrap.className = "control-group";
      const h = document.createElement("h4");
      h.className = "control-group-title";
      h.textContent = name;
      wrap.appendChild(h);
      byName.get(name).forEach((c) => wrap.appendChild(renderControl(fig, c, p[c.key])));
      els.controls.appendChild(wrap);
    });
  }

  function renderControl(fig, c, value) {
    const row = document.createElement("div");
    row.className = "control-row control-row-" + c.type;

    if (c.type === "toggle") {
      const id = "c-" + c.key;
      const input = document.createElement("input");
      input.type = "checkbox";
      input.id = id;
      input.checked = !!value;
      input.addEventListener("change", () => { setValue(fig, c.key, input.checked); renderFigure(); });
      const lab = document.createElement("label");
      lab.htmlFor = id;
      lab.textContent = c.label;
      row.appendChild(input);
      row.appendChild(lab);
      return row;
    }

    const ctrlId = "c-" + c.key;
    const lab = document.createElement("label");
    lab.className = "control-label";
    lab.textContent = c.label;
    if (c.type !== "checklist") lab.htmlFor = ctrlId;
    row.appendChild(lab);

    if (c.type === "text") {
      const input = document.createElement("input");
      input.type = "text";
      input.id = ctrlId;
      input.value = value != null ? value : "";
      input.className = "control-text";
      input.addEventListener("input", () => { setValue(fig, c.key, input.value); renderFigure(); });
      row.appendChild(input);
    } else if (c.type === "color") {
      const input = document.createElement("input");
      input.type = "color";
      input.id = ctrlId;
      input.value = value || "#000000";
      input.className = "control-color";
      input.addEventListener("input", () => { setValue(fig, c.key, input.value); renderFigure(); });
      row.appendChild(input);
    } else if (c.type === "select") {
      const sel = document.createElement("select");
      sel.id = ctrlId;
      sel.className = "control-select";
      c.options.forEach((o) => {
        const opt = document.createElement("option");
        opt.value = o.value;
        opt.textContent = o.label;
        if (String(o.value) === String(value)) opt.selected = true;
        sel.appendChild(opt);
      });
      sel.addEventListener("change", () => { setValue(fig, c.key, sel.value); renderFigure(); });
      row.appendChild(sel);
    } else if (c.type === "checklist") {
      const box = document.createElement("div");
      box.className = "control-checklist";
      c.options.forEach((o) => {
        const id = "c-" + c.key + "-" + o.value;
        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.id = id;
        cb.checked = Array.isArray(value) && value.includes(o.value);
        cb.addEventListener("change", () => {
          const cur = new Set(state.values[fig.id] && state.values[fig.id][c.key] !== undefined
            ? state.values[fig.id][c.key] : c.default);
          if (cb.checked) cur.add(o.value); else cur.delete(o.value);
          setValue(fig, c.key, Array.from(cur));
          renderFigure();
        });
        const l = document.createElement("label");
        l.htmlFor = id;
        l.textContent = o.label;
        const item = document.createElement("span");
        item.className = "checklist-item";
        item.appendChild(cb);
        item.appendChild(l);
        box.appendChild(item);
      });
      row.appendChild(box);
    }
    return row;
  }

  // ----- canvas -----
  function renderFigure() {
    const fig = current();
    if (!fig) return;
    const p = paramsFor(fig);
    const svg = G.el("svg", {
      viewBox: `0 0 ${VIEW_W} ${VIEW_H}`,
      xmlns: G.NS, class: "figure-svg", role: "img", "aria-label": fig.name,
    });
    svg.appendChild(G.defs());
    svg.appendChild(fig.draw({ p, show: p.labels !== false }));
    els.canvas.innerHTML = "";
    els.canvas.appendChild(svg);
  }

  function select(id) {
    state.currentId = id;
    const fig = current();
    els.title.textContent = fig.name;
    els.desc.textContent = fig.description;
    els.sidebar.querySelectorAll(".nav-item").forEach((b) => {
      b.classList.toggle("active", b.dataset.id === id);
    });
    buildControls(fig);
    renderFigure();
  }

  // ----- toolbar -----
  els.reset.addEventListener("click", () => {
    const fig = current();
    if (!fig) return;
    delete state.values[fig.id];
    buildControls(fig);
    renderFigure();
  });

  els.download.addEventListener("click", () => {
    const svg = els.canvas.querySelector("svg");
    if (!svg) return;
    const clone = svg.cloneNode(true);
    clone.setAttribute("xmlns", G.NS);
    const src = '<?xml version="1.0" encoding="UTF-8"?>\n' + new XMLSerializer().serializeToString(clone);
    const blob = new Blob([src], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = (state.currentId || "figure") + ".svg";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  // ----- init -----
  buildSidebar();
  if (figures.length) select(figures[0].id);
})();
