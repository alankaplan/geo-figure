/*
 * figures.js
 * Registry of geometric figures. Each figure exposes:
 *   { id, name, category, description, controls, draw(ctx) -> SVG <g> }
 *
 * controls: an array of control descriptors that the app turns into a live
 *   settings panel. See the `C` helpers below for the available types.
 * draw(ctx): ctx.p holds the resolved control values; ctx.show is a shortcut
 *   for `p.labels !== false`.
 */
(function (global) {
  "use strict";

  const G = global.Geo;
  const { V, el, group, line, polygon, polyline, dot, label, vertexLabel,
          angleArc, rightAngleMark, tickMarks, parallelMarks,
          footOfPerpendicular, palette } = G;

  // ----- control descriptor helpers -----
  const C = {
    toggle: (key, label, def = true, group) => ({ type: "toggle", key, label, default: def, group }),
    text: (key, label, def, group) => ({ type: "text", key, label, default: def, group }),
    select: (key, label, options, def, group) => ({ type: "select", key, label, options, default: def, group }),
    checklist: (key, label, options, def, group) => ({ type: "checklist", key, label, options, default: def, group }),
    color: (key, label, def, group) => ({ type: "color", key, label, default: def, group }),
  };

  // Editable vertex-name text fields, one per default letter.
  function vtext(defaults) {
    return defaults.map((d, i) => C.text("n" + i, "Vertex " + d, d, "Labels"));
  }
  const vnames = (p, n) => Array.from({ length: n }, (_, i) => p["n" + i]);

  const centroid = (pts) => ({
    x: pts.reduce((s, p) => s + p.x, 0) / pts.length,
    y: pts.reduce((s, p) => s + p.y, 0) / pts.length,
  });

  // Draw dots + (optional) labels for named vertices around a centroid.
  function annotateVertices(g, pts, nameArr, show, opts = {}) {
    const c = opts.center || centroid(pts);
    pts.forEach((p, i) => {
      g.appendChild(dot(p));
      if (show && nameArr[i]) {
        g.appendChild(vertexLabel(p, c, nameArr[i], { offset: opts.offset || 18 }));
      }
    });
  }

  // General altitude: from a vertex, perpendicular to the line through sA, sB.
  // Auto-extends the side with a dotted line when the foot lands outside it.
  function drawAltitude(g, from, sA, sB, opts = {}) {
    const f = footOfPerpendicular(from, sA, sB);
    const H = f.point;
    const color = opts.color || palette.altitude;
    if (opts.extend !== false && (f.t < 0 || f.t > 1)) {
      const anchor = f.t < 0 ? sA : sB;
      g.appendChild(line(anchor, H, { stroke: palette.helper, width: 2, dash: "5 5" }));
    }
    g.appendChild(line(from, H, { stroke: color, width: 2.5 }));
    if (opts.rightAngle !== false) {
      const dirPoint = f.t > 1 ? sA : sB;
      g.appendChild(rightAngleMark(H, from, dirPoint, { size: opts.raSize || 12, stroke: color }));
    }
    if (opts.foot !== false) g.appendChild(dot(H, { fill: color, r: 2.8 }));
    if (opts.footLabel) {
      g.appendChild(label({ x: H.x + (opts.flDx || 0), y: H.y + (opts.flDy != null ? opts.flDy : 20) },
        opts.footLabel, { fill: color, italic: opts.footItalic }));
    }
    return H;
  }

  const figures = [];
  const add = (f) => figures.push(f);
  const LABELS = C.toggle("labels", "Show labels", true, "Labels");

  // ============================================================
  // LINES & ANGLES
  // ============================================================
  add({
    id: "segment",
    name: "Line segment",
    category: "Lines & Angles",
    description: "A straight path between two endpoints.",
    controls: [LABELS, ...vtext(["A", "B"])],
    draw({ p, show }) {
      const g = group();
      const A = { x: 90, y: 180 }, B = { x: 390, y: 180 };
      g.appendChild(line(A, B, { width: 2.5 }));
      annotateVertices(g, [A, B], vnames(p, 2), show, { center: { x: 240, y: 210 } });
      return g;
    },
  });

  add({
    id: "ray",
    name: "Line ray",
    category: "Lines & Angles",
    description: "Starts at an endpoint, passes through a second point, and extends without end.",
    controls: [LABELS, ...vtext(["A", "B"])],
    draw({ p, show }) {
      const g = group();
      const A = { x: 100, y: 190 }, B = { x: 250, y: 190 }, end = { x: 410, y: 190 };
      g.appendChild(line(A, end, { width: 2.5, markerEnd: "url(#arrow)" }));
      g.appendChild(dot(A));
      g.appendChild(dot(B));
      const nm = vnames(p, 2);
      if (show) {
        g.appendChild(label({ x: A.x, y: A.y + 24 }, nm[0]));
        g.appendChild(label({ x: B.x, y: B.y + 24 }, nm[1]));
      }
      return g;
    },
  });

  add({
    id: "angle",
    name: "Angle",
    category: "Lines & Angles",
    description: "Two rays sharing a common endpoint (the vertex).",
    controls: [
      LABELS,
      C.text("n0", "Vertex B", "B", "Labels"),
      C.text("n1", "Ray point A", "A", "Labels"),
      C.text("n2", "Ray point C", "C", "Labels"),
      C.text("angleLabel", "Angle label", "β", "Marks"),
      C.toggle("showArc", "Angle arc", true, "Marks"),
    ],
    draw({ p, show }) {
      const g = group();
      const B = { x: 130, y: 280 }, A = { x: 400, y: 250 }, C2 = { x: 340, y: 70 };
      g.appendChild(line(B, A, { width: 2.5, markerEnd: "url(#arrow)" }));
      g.appendChild(line(B, C2, { width: 2.5, markerEnd: "url(#arrow)" }));
      if (p.showArc) {
        g.appendChild(angleArc(B, A, C2, { r: 42, label: show ? p.angleLabel : null, stroke: palette.accent }));
      }
      g.appendChild(dot(B));
      if (show) {
        g.appendChild(label({ x: B.x - 20, y: B.y + 8 }, p.n0));
        g.appendChild(label({ x: A.x + 8, y: A.y + 16 }, p.n1));
        g.appendChild(label({ x: C2.x + 16, y: C2.y - 6 }, p.n2));
      }
      return g;
    },
  });

  // ============================================================
  // TRIANGLES
  // ============================================================
  add({
    id: "triangle",
    name: "Triangle",
    category: "Triangles",
    description: "A polygon with three sides and three vertices (scalene).",
    controls: [LABELS, ...vtext(["A", "B", "C"])],
    draw({ p, show }) {
      const g = group();
      const P = [{ x: 120, y: 290 }, { x: 400, y: 250 }, { x: 250, y: 80 }];
      g.appendChild(polygon(P));
      annotateVertices(g, P, vnames(p, 3), show);
      return g;
    },
  });

  add({
    id: "equilateral",
    name: "Equilateral triangle",
    category: "Triangles",
    description: "All three sides equal and all angles 60°.",
    controls: [
      LABELS, ...vtext(["A", "B", "C"]),
      C.toggle("ticks", "Equal-side ticks", true, "Marks"),
      C.toggle("angles", "Angle arcs", true, "Marks"),
    ],
    draw({ p, show }) {
      const g = group();
      const cx = 245, cy = 205, r = 130;
      const P = [-90, 30, 150].map((deg) => {
        const a = (deg * Math.PI) / 180;
        return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
      });
      g.appendChild(polygon(P));
      if (p.ticks) P.forEach((v, i) => g.appendChild(tickMarks(v, P[(i + 1) % 3], 1)));
      if (p.angles) P.forEach((v, i) => g.appendChild(angleArc(v, P[(i + 1) % 3], P[(i + 2) % 3], { r: 20, stroke: palette.accent })));
      annotateVertices(g, P, vnames(p, 3), show, { center: centroid(P) });
      return g;
    },
  });

  add({
    id: "isosceles",
    name: "Isosceles triangle",
    category: "Triangles",
    description: "Two equal sides and a distinct base; the base angles are equal.",
    controls: [
      LABELS, ...vtext(["A", "B", "C"]),
      C.toggle("ticks", "Equal-leg ticks", true, "Marks"),
      C.toggle("angles", "Base-angle arcs", true, "Marks"),
    ],
    draw({ p, show }) {
      const g = group();
      const apex = { x: 245, y: 80 }, B = { x: 130, y: 290 }, C2 = { x: 360, y: 290 };
      const P = [apex, B, C2];
      g.appendChild(polygon(P));
      if (p.ticks) { g.appendChild(tickMarks(apex, B, 2)); g.appendChild(tickMarks(apex, C2, 2)); }
      if (p.angles) {
        g.appendChild(angleArc(B, apex, C2, { r: 26, stroke: palette.accent }));
        g.appendChild(angleArc(C2, B, apex, { r: 26, stroke: palette.accent }));
      }
      annotateVertices(g, P, vnames(p, 3), show);
      return g;
    },
  });

  add({
    id: "annotated-triangle",
    name: "Annotated triangle",
    category: "Triangles",
    description: "Triangle with named vertices and labelled interior angles.",
    controls: [
      LABELS, ...vtext(["A", "B", "C"]),
      C.toggle("angles", "Angle arcs", true, "Marks"),
      C.text("a0", "Angle at A", "α", "Angle labels"),
      C.text("a1", "Angle at B", "β", "Angle labels"),
      C.text("a2", "Angle at C", "γ", "Angle labels"),
    ],
    draw({ p, show }) {
      const g = group();
      const P = [{ x: 110, y: 290 }, { x: 410, y: 260 }, { x: 260, y: 80 }];
      g.appendChild(polygon(P));
      const greek = [p.a0, p.a1, p.a2];
      if (p.angles) P.forEach((v, i) => g.appendChild(angleArc(v, P[(i + 1) % 3], P[(i + 2) % 3], {
        r: 30, stroke: palette.accent, label: show ? greek[i] : null, labelSize: 15,
      })));
      annotateVertices(g, P, vnames(p, 3), show, { offset: 20 });
      return g;
    },
  });

  add({
    id: "right-triangle",
    name: "Right triangle",
    category: "Triangles",
    description: "One interior angle is exactly 90°, marked with a small square.",
    controls: [
      LABELS, ...vtext(["A", "B", "C"]),
      C.toggle("rightAngle", "Right-angle mark", true, "Marks"),
    ],
    draw({ p, show }) {
      const g = group();
      const B = { x: 130, y: 290 }, A = { x: 130, y: 90 }, C2 = { x: 400, y: 290 };
      const P = [A, B, C2];
      g.appendChild(polygon(P));
      if (p.rightAngle) g.appendChild(rightAngleMark(B, A, C2, { size: 18 }));
      annotateVertices(g, P, vnames(p, 3), show);
      return g;
    },
  });

  const VSEL = [{ value: "0", label: "A" }, { value: "1", label: "B" }, { value: "2", label: "C" }];
  add({
    id: "altitude",
    name: "Altitude of a triangle",
    category: "Triangles",
    description: "Perpendicular segment from a chosen vertex to the opposite side.",
    controls: [
      LABELS, ...vtext(["A", "B", "C"]),
      C.select("from", "Altitude from", VSEL, "2", "Altitude"),
      C.color("color", "Altitude color", "#e11d48", "Altitude"),
      C.toggle("rightAngle", "Right-angle mark", true, "Altitude"),
      C.text("footLabel", "Foot label", "H", "Altitude"),
    ],
    draw({ p, show }) {
      const g = group();
      const P = [{ x: 250, y: 90 }, { x: 120, y: 280 }, { x: 380, y: 280 }];
      g.appendChild(polygon(P));
      const fi = parseInt(p.from, 10);
      const from = P[fi], sA = P[(fi + 1) % 3], sB = P[(fi + 2) % 3];
      drawAltitude(g, from, sA, sB, {
        color: p.color, rightAngle: p.rightAngle,
        footLabel: show ? p.footLabel : null,
      });
      annotateVertices(g, P, vnames(p, 3), show);
      return g;
    },
  });

  add({
    id: "external-altitude",
    name: "External altitude",
    category: "Triangles",
    description: "In an obtuse triangle the foot lands outside the base; the side is extended with a dotted line.",
    controls: [
      LABELS, ...vtext(["A", "B", "C"]),
      C.select("from", "Altitude from", VSEL, "0", "Altitude"),
      C.color("color", "Altitude color", "#e11d48", "Altitude"),
      C.toggle("extend", "Dotted side extension", true, "Altitude"),
      C.toggle("rightAngle", "Right-angle mark", true, "Altitude"),
      C.text("footLabel", "Foot label", "H", "Altitude"),
    ],
    draw({ p, show }) {
      const g = group();
      const P = [{ x: 150, y: 110 }, { x: 210, y: 250 }, { x: 400, y: 250 }]; // obtuse at B
      g.appendChild(polygon(P));
      const fi = parseInt(p.from, 10);
      const from = P[fi], sA = P[(fi + 1) % 3], sB = P[(fi + 2) % 3];
      drawAltitude(g, from, sA, sB, {
        color: p.color, extend: p.extend, rightAngle: p.rightAngle,
        footLabel: show ? p.footLabel : null,
      });
      annotateVertices(g, P, vnames(p, 3), show);
      return g;
    },
  });

  add({
    id: "colored-altitudes",
    name: "Colored altitudes",
    category: "Triangles",
    description: "Draw any of the three altitudes in distinct colors; they meet at the orthocenter.",
    controls: [
      LABELS, ...vtext(["A", "B", "C"]),
      C.checklist("which", "Altitudes to draw", VSEL, ["0", "1", "2"], "Altitudes"),
      C.color("cA", "From A", "#e11d48", "Altitudes"),
      C.color("cB", "From B", "#0d9488", "Altitudes"),
      C.color("cC", "From C", "#7c3aed", "Altitudes"),
      C.toggle("rightAngle", "Right-angle marks", false, "Altitudes"),
    ],
    draw({ p, show }) {
      const g = group();
      const P = [{ x: 230, y: 80 }, { x: 110, y: 285 }, { x: 390, y: 270 }];
      g.appendChild(polygon(P));
      const cols = [p.cA, p.cB, p.cC];
      const which = p.which || [];
      [0, 1, 2].forEach((i) => {
        if (!which.includes(String(i))) return;
        drawAltitude(g, P[i], P[(i + 1) % 3], P[(i + 2) % 3], {
          color: cols[i], rightAngle: p.rightAngle, raSize: 10,
        });
      });
      annotateVertices(g, P, vnames(p, 3), show);
      return g;
    },
  });

  // ============================================================
  // QUADRILATERALS
  // ============================================================
  add({
    id: "rectangle",
    name: "Rectangle",
    category: "Quadrilaterals",
    description: "Four right angles; opposite sides are equal.",
    controls: [
      LABELS, ...vtext(["A", "B", "C", "D"]),
      C.toggle("rightAngles", "Right-angle marks", true, "Marks"),
      C.toggle("ticks", "Equal-side ticks", true, "Marks"),
    ],
    draw({ p, show }) {
      const g = group();
      const A = { x: 110, y: 110 }, B = { x: 390, y: 110 }, C2 = { x: 390, y: 260 }, D = { x: 110, y: 260 };
      const P = [A, B, C2, D];
      g.appendChild(polygon(P));
      if (p.rightAngles) P.forEach((v, i) => g.appendChild(rightAngleMark(v, P[(i + 3) % 4], P[(i + 1) % 4], { size: 13 })));
      if (p.ticks) {
        g.appendChild(tickMarks(A, B, 1)); g.appendChild(tickMarks(D, C2, 1));
        g.appendChild(tickMarks(B, C2, 2)); g.appendChild(tickMarks(A, D, 2));
      }
      annotateVertices(g, P, vnames(p, 4), show);
      return g;
    },
  });

  add({
    id: "square",
    name: "Square",
    category: "Quadrilaterals",
    description: "Four equal sides and four right angles.",
    controls: [
      LABELS, ...vtext(["A", "B", "C", "D"]),
      C.toggle("rightAngles", "Right-angle marks", true, "Marks"),
      C.toggle("ticks", "Equal-side ticks", true, "Marks"),
    ],
    draw({ p, show }) {
      const g = group();
      const s = 190, x0 = 150, y0 = 90;
      const A = { x: x0, y: y0 }, B = { x: x0 + s, y: y0 }, C2 = { x: x0 + s, y: y0 + s }, D = { x: x0, y: y0 + s };
      const P = [A, B, C2, D];
      g.appendChild(polygon(P));
      P.forEach((v, i) => {
        if (p.rightAngles) g.appendChild(rightAngleMark(v, P[(i + 3) % 4], P[(i + 1) % 4], { size: 13 }));
        if (p.ticks) g.appendChild(tickMarks(v, P[(i + 1) % 4], 1));
      });
      annotateVertices(g, P, vnames(p, 4), show);
      return g;
    },
  });

  add({
    id: "quadrilateral",
    name: "Quadrilateral",
    category: "Quadrilaterals",
    description: "A general four-sided polygon.",
    controls: [LABELS, ...vtext(["A", "B", "C", "D"])],
    draw({ p, show }) {
      const g = group();
      const P = [{ x: 100, y: 150 }, { x: 300, y: 90 }, { x: 400, y: 240 }, { x: 170, y: 300 }];
      g.appendChild(polygon(P));
      annotateVertices(g, P, vnames(p, 4), show);
      return g;
    },
  });

  // ============================================================
  // PARALLELS & PARALLELOGRAMS
  // ============================================================
  add({
    id: "parallel-lines",
    name: "Parallel lines",
    category: "Parallels & Parallelograms",
    description: "Two lines that never meet, optionally cut by a transversal.",
    controls: [
      LABELS,
      C.text("n0", "First line", "m", "Labels"),
      C.text("n1", "Second line", "n", "Labels"),
      C.toggle("marks", "Parallel marks", true, "Marks"),
      C.toggle("transversal", "Transversal", true, "Marks"),
    ],
    draw({ p, show }) {
      const g = group();
      const m1 = { x: 80, y: 140 }, m2 = { x: 420, y: 140 };
      const n1 = { x: 80, y: 250 }, n2 = { x: 420, y: 250 };
      g.appendChild(line(m1, m2, { width: 2.5, markerStart: "url(#arrow)", markerEnd: "url(#arrow)" }));
      g.appendChild(line(n1, n2, { width: 2.5, markerStart: "url(#arrow)", markerEnd: "url(#arrow)" }));
      if (p.marks) { g.appendChild(parallelMarks(m1, m2, 1)); g.appendChild(parallelMarks(n1, n2, 1)); }
      if (p.transversal) g.appendChild(line({ x: 150, y: 100 }, { x: 330, y: 290 }, { stroke: palette.accent, width: 2 }));
      if (show) {
        g.appendChild(label({ x: 440, y: 140 }, p.n0, { italic: true }));
        g.appendChild(label({ x: 440, y: 250 }, p.n1, { italic: true }));
      }
      return g;
    },
  });

  add({
    id: "parallelogram",
    name: "Parallelogram",
    category: "Parallels & Parallelograms",
    description: "Both pairs of opposite sides parallel and equal.",
    controls: [
      LABELS, ...vtext(["A", "B", "C", "D"]),
      C.toggle("parallel", "Parallel marks", true, "Marks"),
      C.toggle("ticks", "Equal-side ticks", true, "Marks"),
    ],
    draw({ p, show }) {
      const g = group();
      const A = { x: 110, y: 260 }, B = { x: 310, y: 260 }, C2 = { x: 390, y: 110 }, D = { x: 190, y: 110 };
      const P = [A, B, C2, D];
      g.appendChild(polygon(P));
      if (p.parallel) {
        g.appendChild(parallelMarks(A, B, 1)); g.appendChild(parallelMarks(D, C2, 1));
        g.appendChild(parallelMarks(B, C2, 2)); g.appendChild(parallelMarks(A, D, 2));
      }
      if (p.ticks) { g.appendChild(tickMarks(A, B, 1)); g.appendChild(tickMarks(D, C2, 1)); }
      annotateVertices(g, P, vnames(p, 4), show);
      return g;
    },
  });

  add({
    id: "rhombus",
    name: "Rhombus",
    category: "Parallels & Parallelograms",
    description: "A parallelogram with all four sides equal.",
    controls: [
      LABELS, ...vtext(["A", "B", "C", "D"]),
      C.toggle("ticks", "Equal-side ticks", true, "Marks"),
      C.toggle("parallel", "Parallel marks", true, "Marks"),
    ],
    draw({ p, show }) {
      const g = group();
      const A = { x: 130, y: 260 }, B = { x: 330, y: 260 }, C2 = { x: 410, y: 130 }, D = { x: 210, y: 130 };
      const P = [A, B, C2, D];
      g.appendChild(polygon(P));
      if (p.ticks) P.forEach((v, i) => g.appendChild(tickMarks(v, P[(i + 1) % 4], 1)));
      if (p.parallel) {
        g.appendChild(parallelMarks(A, B, 1)); g.appendChild(parallelMarks(D, C2, 1));
        g.appendChild(parallelMarks(B, C2, 2)); g.appendChild(parallelMarks(A, D, 2));
      }
      annotateVertices(g, P, vnames(p, 4), show);
      return g;
    },
  });

  add({
    id: "parallelogram-altitudes",
    name: "Altitudes of a parallelogram",
    category: "Parallels & Parallelograms",
    description: "Heights to either base, drawn in color with right-angle feet.",
    controls: [
      LABELS, ...vtext(["A", "B", "C", "D"]),
      C.toggle("hAB", "Height to base AB", true, "Altitudes"),
      C.color("cAB", "AB height color", "#e11d48", "Altitudes"),
      C.toggle("hAD", "Height to base AD", true, "Altitudes"),
      C.color("cAD", "AD height color", "#0d9488", "Altitudes"),
    ],
    draw({ p, show }) {
      const g = group();
      const A = { x: 110, y: 270 }, B = { x: 320, y: 270 }, C2 = { x: 400, y: 120 }, D = { x: 190, y: 120 };
      const P = [A, B, C2, D];
      g.appendChild(polygon(P));
      if (p.hAB) drawAltitude(g, D, A, B, { color: p.cAB });
      if (p.hAD) drawAltitude(g, B, A, D, { color: p.cAD });
      annotateVertices(g, P, vnames(p, 4), show);
      return g;
    },
  });

  // ============================================================
  // TRAPEZOIDS
  // ============================================================
  add({
    id: "trapezoid",
    name: "Trapezoid",
    category: "Trapezoids",
    description: "Exactly one pair of parallel sides (the bases).",
    controls: [
      LABELS, ...vtext(["A", "B", "C", "D"]),
      C.toggle("parallel", "Parallel marks", true, "Marks"),
    ],
    draw({ p, show }) {
      const g = group();
      const A = { x: 100, y: 270 }, B = { x: 400, y: 270 }, C2 = { x: 330, y: 120 }, D = { x: 180, y: 120 };
      const P = [A, B, C2, D];
      g.appendChild(polygon(P));
      if (p.parallel) { g.appendChild(parallelMarks(A, B, 1)); g.appendChild(parallelMarks(D, C2, 1)); }
      annotateVertices(g, P, vnames(p, 4), show);
      return g;
    },
  });

  add({
    id: "trapezoid-altitude",
    name: "Altitude of a trapezoid",
    category: "Trapezoids",
    description: "The height: perpendicular distance between the two parallel bases.",
    controls: [
      LABELS, ...vtext(["A", "B", "C", "D"]),
      C.toggle("parallel", "Parallel marks", true, "Marks"),
      C.color("color", "Height color", "#e11d48", "Altitude"),
      C.text("footLabel", "Height label", "h", "Altitude"),
    ],
    draw({ p, show }) {
      const g = group();
      const A = { x: 100, y: 270 }, B = { x: 400, y: 270 }, C2 = { x: 330, y: 120 }, D = { x: 180, y: 120 };
      const P = [A, B, C2, D];
      g.appendChild(polygon(P));
      if (p.parallel) { g.appendChild(parallelMarks(A, B, 1)); g.appendChild(parallelMarks(D, C2, 1)); }
      const H = footOfPerpendicular(D, A, B).point;
      g.appendChild(line(D, H, { stroke: p.color, width: 2.5 }));
      g.appendChild(rightAngleMark(H, B, D, { size: 12, stroke: p.color }));
      g.appendChild(dot(H, { fill: p.color, r: 2.8 }));
      if (show && p.footLabel) g.appendChild(label({ x: H.x - 12, y: (H.y + D.y) / 2 }, p.footLabel, { fill: p.color, italic: true }));
      annotateVertices(g, P, vnames(p, 4), show);
      return g;
    },
  });

  // ============================================================
  // 3D SOLIDS
  // ============================================================
  // Oblique projection box. front top-left (x,y), size w x h, depth vector d.
  function drawBox(g, x, y, w, h, d, opts = {}) {
    const FTL = { x, y }, FTR = { x: x + w, y }, FBR = { x: x + w, y: y + h }, FBL = { x, y: y + h };
    const BTL = V.add(FTL, d), BTR = V.add(FTR, d), BBR = V.add(FBR, d), BBL = V.add(FBL, d);
    if (opts.hidden !== false) {
      const hs = { stroke: palette.helper, width: 1.6, dash: "5 4" };
      g.appendChild(line(BBL, BBR, hs));
      g.appendChild(line(BBL, BTL, hs));
      g.appendChild(line(FBL, BBL, hs));
    }
    g.appendChild(line(FTL, BTL, { width: 2 }));
    g.appendChild(line(FTR, BTR, { width: 2 }));
    g.appendChild(line(FBR, BBR, { width: 2 }));
    g.appendChild(line(BTL, BTR, { width: 2 }));
    g.appendChild(line(BTR, BBR, { width: 2 }));
    g.appendChild(polygon([FTL, FTR, FBR, FBL], { width: 2.2, fill: "rgba(37,99,235,0.06)" }));
    return { FTL, FTR, FBR, FBL, BTL, BTR, BBR, BBL };
  }

  add({
    id: "parallelepiped",
    name: "Rectangular parallelepiped",
    category: "3D Solids",
    description: "A box (cuboid): 6 rectangular faces. Hidden edges are dashed.",
    controls: [
      C.toggle("labels", "Show dimension labels", true, "Labels"),
      C.text("l", "Length label", "length", "Labels"),
      C.text("h", "Height label", "height", "Labels"),
      C.text("d", "Depth label", "depth", "Labels"),
      C.toggle("hidden", "Dashed hidden edges", true, "Marks"),
    ],
    draw({ p, show }) {
      const g = group();
      drawBox(g, 120, 150, 210, 130, { x: 70, y: -55 }, { hidden: p.hidden });
      if (show) {
        g.appendChild(label({ x: 225, y: 300 }, p.l, { size: 13, fill: palette.helper, weight: 500 }));
        g.appendChild(label({ x: 100, y: 225 }, p.h, { size: 13, fill: palette.helper, weight: 500, anchor: "end" }));
        g.appendChild(label({ x: 380, y: 150 }, p.d, { size: 13, fill: palette.helper, weight: 500, anchor: "start" }));
      }
      return g;
    },
  });

  add({
    id: "cube",
    name: "Cube",
    category: "3D Solids",
    description: "A parallelepiped with all edges equal.",
    controls: [
      C.toggle("labels", "Show edge label", true, "Labels"),
      C.text("edge", "Edge label", "a", "Labels"),
      C.toggle("ticks", "Equal-edge ticks", true, "Marks"),
      C.toggle("hidden", "Dashed hidden edges", true, "Marks"),
    ],
    draw({ p, show }) {
      const g = group();
      drawBox(g, 130, 160, 170, 170, { x: 60, y: -60 }, { hidden: p.hidden });
      if (p.ticks) {
        g.appendChild(tickMarks({ x: 130, y: 160 }, { x: 300, y: 160 }, 1));
        g.appendChild(tickMarks({ x: 300, y: 160 }, { x: 300, y: 330 }, 1));
        g.appendChild(tickMarks({ x: 300, y: 160 }, { x: 360, y: 100 }, 1));
      }
      if (show && p.edge) g.appendChild(label({ x: 215, y: 148 }, p.edge, { size: 13, fill: palette.helper, weight: 500, italic: true }));
      return g;
    },
  });

  global.Figures = figures;
})(window);
