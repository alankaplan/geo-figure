/*
 * geometry.js
 * A small dependency-free helper library for building geometric figures as SVG.
 * All drawing helpers return SVG DOM nodes created in the SVG namespace.
 */
(function (global) {
  "use strict";

  const NS = "http://www.w3.org/2000/svg";

  // ----- vector math (points are {x, y}) -----
  const V = {
    add: (a, b) => ({ x: a.x + b.x, y: a.y + b.y }),
    sub: (a, b) => ({ x: a.x - b.x, y: a.y - b.y }),
    scale: (a, s) => ({ x: a.x * s, y: a.y * s }),
    len: (a) => Math.hypot(a.x, a.y),
    dist: (a, b) => Math.hypot(a.x - b.x, a.y - b.y),
    mid: (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }),
    dot: (a, b) => a.x * b.x + a.y * b.y,
    norm: (a) => {
      const l = Math.hypot(a.x, a.y) || 1;
      return { x: a.x / l, y: a.y / l };
    },
    // unit perpendicular (rotated +90deg in screen coords)
    perp: (a) => {
      const l = Math.hypot(a.x, a.y) || 1;
      return { x: -a.y / l, y: a.x / l };
    },
    rotate: (a, ang) => ({
      x: a.x * Math.cos(ang) - a.y * Math.sin(ang),
      y: a.x * Math.sin(ang) + a.y * Math.cos(ang),
    }),
    // rotate point p around center c by ang radians
    rotateAround: (p, c, ang) => {
      const d = V.sub(p, c);
      return V.add(c, V.rotate(d, ang));
    },
  };

  // foot of the perpendicular from point P onto the (infinite) line through A and B
  function footOfPerpendicular(P, A, B) {
    const AB = V.sub(B, A);
    const t = V.dot(V.sub(P, A), AB) / V.dot(AB, AB);
    return { point: V.add(A, V.scale(AB, t)), t };
  }

  // ----- SVG element factory -----
  function el(name, attrs, children) {
    const node = document.createElementNS(NS, name);
    if (attrs) {
      for (const k in attrs) {
        if (attrs[k] === undefined || attrs[k] === null) continue;
        node.setAttribute(k, attrs[k]);
      }
    }
    if (children) {
      (Array.isArray(children) ? children : [children]).forEach((c) => {
        if (c) node.appendChild(c);
      });
    }
    return node;
  }

  function group(className) {
    return el("g", className ? { class: className } : null);
  }

  // ----- styling constants -----
  const STROKE = "#1f2933";
  const ACCENT = "#2563eb";
  const HELPER = "#94a3b8";
  const palette = {
    stroke: STROKE,
    accent: ACCENT,
    helper: HELPER,
    altitude: "#e11d48",
    altitude2: "#0d9488",
    altitude3: "#7c3aed",
    fill: "rgba(37, 99, 235, 0.07)",
  };

  // ----- primitive drawing helpers -----
  function line(a, b, opts = {}) {
    return el("line", {
      x1: a.x, y1: a.y, x2: b.x, y2: b.y,
      stroke: opts.stroke || STROKE,
      "stroke-width": opts.width || 2,
      "stroke-dasharray": opts.dash || null,
      "stroke-linecap": opts.cap || "round",
      "marker-start": opts.markerStart || null,
      "marker-end": opts.markerEnd || null,
      class: opts.class || null,
    });
  }

  function polygon(points, opts = {}) {
    return el("polygon", {
      points: points.map((p) => `${p.x},${p.y}`).join(" "),
      fill: opts.fill || palette.fill,
      stroke: opts.stroke || STROKE,
      "stroke-width": opts.width || 2,
      "stroke-linejoin": "round",
      "stroke-dasharray": opts.dash || null,
    });
  }

  function polyline(points, opts = {}) {
    return el("polyline", {
      points: points.map((p) => `${p.x},${p.y}`).join(" "),
      fill: "none",
      stroke: opts.stroke || STROKE,
      "stroke-width": opts.width || 2,
      "stroke-linejoin": "round",
      "stroke-linecap": "round",
      "stroke-dasharray": opts.dash || null,
    });
  }

  function dot(p, opts = {}) {
    return el("circle", {
      cx: p.x, cy: p.y, r: opts.r || 3.2,
      fill: opts.fill || STROKE,
      stroke: opts.stroke || "#fff",
      "stroke-width": opts.width != null ? opts.width : 1,
    });
  }

  // Render label text into a <text> node, turning `_x` / `_{xy}` into
  // subscripts (e.g. "A_1" -> A with a subscript 1).
  function setLabelContent(node, text) {
    node.textContent = "";
    if (text == null) return;
    const s = String(text);
    const re = /_(\{[^}]*\}|.)/g;
    let last = 0, m;
    while ((m = re.exec(s)) !== null) {
      if (m.index > last) node.appendChild(document.createTextNode(s.slice(last, m.index)));
      let sub = m[1];
      if (sub.charAt(0) === "{") sub = sub.slice(1, -1);
      const ts = el("tspan", { "baseline-shift": "sub", "font-size": "0.72em" });
      ts.textContent = sub;
      node.appendChild(ts);
      last = m.index + m[0].length;
    }
    if (last < s.length) node.appendChild(document.createTextNode(s.slice(last)));
  }

  // A text label. Supports `_` subscript syntax (see setLabelContent).
  function label(p, text, opts = {}) {
    const t = el("text", {
      x: p.x + (opts.dx || 0),
      y: p.y + (opts.dy || 0),
      fill: opts.fill || STROKE,
      "font-size": opts.size || 16,
      "font-style": opts.italic ? "italic" : null,
      "font-weight": opts.weight || 600,
      "text-anchor": opts.anchor || "middle",
      "dominant-baseline": opts.baseline || "middle",
      class: "fig-label" + (opts.class ? " " + opts.class : ""),
    });
    setLabelContent(t, text);
    return t;
  }

  // Place a vertex label just outside a polygon vertex, away from the centroid.
  function vertexLabel(vertex, centroid, text, opts = {}) {
    const dir = V.norm(V.sub(vertex, centroid));
    const off = opts.offset || 18;
    const p = V.add(vertex, V.scale(dir, off));
    return label(p, text, opts);
  }

  // Arc marking the interior angle at vertex V between rays toward A and B.
  function angleArc(vertex, A, B, opts = {}) {
    const r = opts.r || 22;
    const uA = V.norm(V.sub(A, vertex));
    const uB = V.norm(V.sub(B, vertex));
    const p1 = V.add(vertex, V.scale(uA, r));
    const p2 = V.add(vertex, V.scale(uB, r));
    let a1 = Math.atan2(uA.y, uA.x);
    let a2 = Math.atan2(uB.y, uB.x);
    let delta = a2 - a1;
    while (delta <= -Math.PI) delta += 2 * Math.PI;
    while (delta > Math.PI) delta -= 2 * Math.PI;
    const sweep = delta >= 0 ? 1 : 0;
    const large = Math.abs(delta) > Math.PI ? 1 : 0;
    const path = el("path", {
      d: `M ${p1.x} ${p1.y} A ${r} ${r} 0 ${large} ${sweep} ${p2.x} ${p2.y}`,
      fill: "none",
      stroke: opts.stroke || palette.accent,
      "stroke-width": opts.width || 2,
    });
    const g = group("angle-mark");
    g.appendChild(path);
    if (opts.label) {
      const midDir = V.norm(V.add(uA, uB));
      const lp = V.add(vertex, V.scale(midDir, r + 14));
      g.appendChild(label(lp, opts.label, { size: opts.labelSize || 14, fill: opts.stroke || palette.accent }));
    }
    return g;
  }

  // Small square marking a right angle at vertex V between rays toward A and B.
  function rightAngleMark(vertex, A, B, opts = {}) {
    const s = opts.size || 14;
    const uA = V.norm(V.sub(A, vertex));
    const uB = V.norm(V.sub(B, vertex));
    const c1 = V.add(vertex, V.scale(uA, s));
    const c2 = V.add(vertex, V.add(V.scale(uA, s), V.scale(uB, s)));
    const c3 = V.add(vertex, V.scale(uB, s));
    return polyline([c1, c2, c3], {
      stroke: opts.stroke || palette.accent,
      width: opts.width || 1.8,
    });
  }

  // Equal-length tick marks (1..3) centered on segment AB.
  function tickMarks(A, B, count, opts = {}) {
    const g = group("ticks");
    const u = V.norm(V.sub(B, A));
    const p = V.perp(u);
    const M = V.mid(A, B);
    const len = opts.len || 7;
    const gap = opts.gap || 5;
    const start = -((count - 1) * gap) / 2;
    for (let i = 0; i < count; i++) {
      const c = V.add(M, V.scale(u, start + i * gap));
      const a = V.add(c, V.scale(p, len));
      const b = V.add(c, V.scale(p, -len));
      g.appendChild(line(a, b, { stroke: opts.stroke || STROKE, width: 1.8 }));
    }
    return g;
  }

  // Parallel-direction arrow marks (chevrons) centered on segment AB.
  function parallelMarks(A, B, count, opts = {}) {
    const g = group("parallel-marks");
    const u = V.norm(V.sub(B, A));
    const p = V.perp(u);
    const M = V.mid(A, B);
    const size = opts.size || 6;
    const gap = opts.gap || 7;
    const start = -((count - 1) * gap) / 2;
    for (let i = 0; i < count; i++) {
      const c = V.add(M, V.scale(u, start + i * gap));
      const tip = V.add(c, V.scale(u, size * 0.7));
      const w1 = V.add(V.sub(c, V.scale(u, size * 0.3)), V.scale(p, size));
      const w2 = V.add(V.sub(c, V.scale(u, size * 0.3)), V.scale(p, -size));
      g.appendChild(polyline([w1, tip, w2], { stroke: opts.stroke || palette.accent, width: 1.8 }));
    }
    return g;
  }

  // ----- arrowhead marker defs (for rays / lines) -----
  function defs() {
    const d = el("defs");
    const mk = (id, color) =>
      el("marker", {
        id, markerWidth: 10, markerHeight: 10,
        refX: 8, refY: 5, orient: "auto", markerUnits: "userSpaceOnUse",
      }, el("path", { d: "M0,1 L8,5 L0,9 Z", fill: color }));
    d.appendChild(mk("arrow", STROKE));
    d.appendChild(mk("arrow-accent", ACCENT));
    return d;
  }

  global.Geo = {
    NS, V, footOfPerpendicular, el, group, line, polygon, polyline,
    dot, label, vertexLabel, angleArc, rightAngleMark, tickMarks,
    parallelMarks, defs, palette,
  };
})(window);
