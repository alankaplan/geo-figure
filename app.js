/*
 * app.js
 * Wires the figure registry to the sidebar, canvas, and toolbar controls.
 */
(function () {
  "use strict";

  const G = window.Geo;
  const figures = window.Figures;

  const VIEW_W = 480, VIEW_H = 360;

  const els = {
    sidebar: document.getElementById("sidebar"),
    canvas: document.getElementById("canvas"),
    title: document.getElementById("figure-title"),
    desc: document.getElementById("figure-desc"),
    toggleLabels: document.getElementById("toggle-labels"),
    download: document.getElementById("download-svg"),
  };

  const state = {
    currentId: null,
    showLabels: true,
  };

  // ----- build the sidebar grouped by category -----
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

  // ----- render a figure into the canvas -----
  function render() {
    const fig = figures.find((f) => f.id === state.currentId);
    if (!fig) return;

    els.title.textContent = fig.name;
    els.desc.textContent = fig.description;

    const svg = G.el("svg", {
      viewBox: `0 0 ${VIEW_W} ${VIEW_H}`,
      xmlns: G.NS,
      class: "figure-svg",
      role: "img",
      "aria-label": fig.name,
    });
    svg.appendChild(G.defs());
    svg.appendChild(fig.draw({ showLabels: state.showLabels }));

    els.canvas.innerHTML = "";
    els.canvas.appendChild(svg);

    // reflect active state in sidebar
    els.sidebar.querySelectorAll(".nav-item").forEach((b) => {
      b.classList.toggle("active", b.dataset.id === state.currentId);
    });
  }

  function select(id) {
    state.currentId = id;
    render();
  }

  // ----- toolbar controls -----
  els.toggleLabels.addEventListener("click", () => {
    state.showLabels = !state.showLabels;
    els.toggleLabels.textContent = "Labels: " + (state.showLabels ? "on" : "off");
    els.toggleLabels.setAttribute("aria-pressed", String(state.showLabels));
    render();
  });

  els.download.addEventListener("click", () => {
    const svg = els.canvas.querySelector("svg");
    if (!svg) return;
    const clone = svg.cloneNode(true);
    clone.setAttribute("xmlns", G.NS);
    const src = '<?xml version="1.0" encoding="UTF-8"?>\n' +
      new XMLSerializer().serializeToString(clone);
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
