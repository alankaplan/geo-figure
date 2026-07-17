/*
 * figures.js
 * Registry of geometric figures. Each figure exposes:
 *   { id, name, category, description, draw(ctx) -> SVG <g> }
 * ctx = { showLabels: boolean }
 */
(function (global) {
  "use strict";

  const G = global.Geo;
  const { V, el, group, line, polygon, polyline, dot, label, vertexLabel,
          angleArc, rightAngleMark, tickMarks, parallelMarks,
          footOfPerpendicular, palette } = G;

  const centroid = (pts) => ({
    x: pts.reduce((s, p) => s + p.x, 0) / pts.length,
    y: pts.reduce((s, p) => s + p.y, 0) / pts.length,
  });

  // Draw dots + labels for a set of named vertices around a centroid.
  function annotateVertices(g, pts, names, ctx, opts = {}) {
    const c = opts.center || centroid(pts);
    pts.forEach((p, i) => {
      g.appendChild(dot(p));
      if (ctx.showLabels && names[i]) {
        g.appendChild(vertexLabel(p, c, names[i], { offset: opts.offset || 18 }));
      }
    });
  }

  const figures = [];
  const add = (f) => figures.push(f);

  // ============================================================
  // LINES & ANGLES
  // ============================================================
  add({
    id: "segment",
    name: "Line segment",
    category: "Lines & Angles",
    description: "A straight path between two endpoints A and B.",
    draw(ctx) {
      const g = group();
      const A = { x: 90, y: 180 }, B = { x: 390, y: 180 };
      g.appendChild(line(A, B, { width: 2.5 }));
      annotateVertices(g, [A, B], ["A", "B"], ctx, { center: { x: 240, y: 210 } });
      return g;
    },
  });

  add({
    id: "ray",
    name: "Line ray",
    category: "Lines & Angles",
    description: "Starts at endpoint A, passes through B, and extends without end.",
    draw(ctx) {
      const g = group();
      const A = { x: 100, y: 190 }, B = { x: 250, y: 190 };
      const end = { x: 410, y: 190 };
      g.appendChild(line(A, end, { width: 2.5, markerEnd: "url(#arrow)" }));
      g.appendChild(dot(A));
      g.appendChild(dot(B));
      if (ctx.showLabels) {
        g.appendChild(label({ x: A.x, y: A.y + 24 }, "A"));
        g.appendChild(label({ x: B.x, y: B.y + 24 }, "B"));
      }
      return g;
    },
  });

  add({
    id: "angle",
    name: "Angle",
    category: "Lines & Angles",
    description: "Two rays sharing a common endpoint (the vertex B).",
    draw(ctx) {
      const g = group();
      const B = { x: 130, y: 280 };
      const A = { x: 400, y: 250 };
      const C = { x: 340, y: 70 };
      g.appendChild(line(B, A, { width: 2.5, markerEnd: "url(#arrow)" }));
      g.appendChild(line(B, C, { width: 2.5, markerEnd: "url(#arrow)" }));
      g.appendChild(angleArc(B, A, C, { r: 42, label: ctx.showLabels ? "β" : null, stroke: palette.accent }));
      g.appendChild(dot(B));
      if (ctx.showLabels) {
        g.appendChild(label({ x: B.x - 20, y: B.y + 8 }, "B"));
        g.appendChild(label({ x: A.x + 8, y: A.y + 16 }, "A"));
        g.appendChild(label({ x: C.x + 16, y: C.y - 6 }, "C"));
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
    draw(ctx) {
      const g = group();
      const P = [{ x: 120, y: 290 }, { x: 400, y: 250 }, { x: 250, y: 80 }];
      g.appendChild(polygon(P));
      annotateVertices(g, P, ["A", "B", "C"], ctx);
      return g;
    },
  });

  add({
    id: "equilateral",
    name: "Equilateral triangle",
    category: "Triangles",
    description: "All three sides equal and all angles 60°. Tick marks show equal sides.",
    draw(ctx) {
      const g = group();
      const cx = 245, cy = 205, r = 130;
      const P = [-90, 30, 150].map((deg) => {
        const a = (deg * Math.PI) / 180;
        return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
      });
      g.appendChild(polygon(P));
      // equal-side ticks
      g.appendChild(tickMarks(P[0], P[1], 1));
      g.appendChild(tickMarks(P[1], P[2], 1));
      g.appendChild(tickMarks(P[2], P[0], 1));
      // 60 degree angle arcs
      const c = centroid(P);
      P.forEach((v, i) => {
        const a = P[(i + 1) % 3], b = P[(i + 2) % 3];
        g.appendChild(angleArc(v, a, b, { r: 20, stroke: palette.accent }));
      });
      annotateVertices(g, P, ["A", "B", "C"], ctx, { center: c });
      return g;
    },
  });

  add({
    id: "isosceles",
    name: "Isosceles triangle",
    category: "Triangles",
    description: "Two equal sides (double ticks) and a distinct base; base angles are equal.",
    draw(ctx) {
      const g = group();
      const apex = { x: 245, y: 80 };
      const B = { x: 130, y: 290 };
      const C = { x: 360, y: 290 };
      const P = [apex, B, C];
      g.appendChild(polygon(P));
      g.appendChild(tickMarks(apex, B, 2)); // equal legs
      g.appendChild(tickMarks(apex, C, 2));
      // equal base angles
      g.appendChild(angleArc(B, apex, C, { r: 26, stroke: palette.accent }));
      g.appendChild(angleArc(C, B, apex, { r: 26, stroke: palette.accent }));
      annotateVertices(g, P, ["A", "B", "C"], ctx);
      return g;
    },
  });

  add({
    id: "annotated-triangle",
    name: "Annotated triangle",
    category: "Triangles",
    description: "Triangle with vertices A, B, C and interior angles α, β, γ marked.",
    draw(ctx) {
      const g = group();
      const P = [{ x: 110, y: 290 }, { x: 410, y: 260 }, { x: 260, y: 80 }];
      g.appendChild(polygon(P));
      const names = ["A", "B", "C"];
      const greek = ["α", "β", "γ"];
      P.forEach((v, i) => {
        const a = P[(i + 1) % 3], b = P[(i + 2) % 3];
        g.appendChild(angleArc(v, a, b, {
          r: 30, stroke: palette.accent,
          label: ctx.showLabels ? greek[i] : null, labelSize: 15,
        }));
      });
      annotateVertices(g, P, names, ctx, { offset: 20 });
      return g;
    },
  });

  add({
    id: "right-triangle",
    name: "Right triangle",
    category: "Triangles",
    description: "One interior angle is exactly 90°, marked with a small square.",
    draw(ctx) {
      const g = group();
      const B = { x: 130, y: 290 };  // right angle here
      const A = { x: 130, y: 90 };
      const C = { x: 400, y: 290 };
      const P = [A, B, C];
      g.appendChild(polygon(P));
      g.appendChild(rightAngleMark(B, A, C, { size: 18 }));
      annotateVertices(g, P, ["A", "B", "C"], ctx);
      return g;
    },
  });

  add({
    id: "altitude",
    name: "Altitude of a triangle",
    category: "Triangles",
    description: "Perpendicular segment from a vertex to the opposite side (foot H).",
    draw(ctx) {
      const g = group();
      const B = { x: 120, y: 280 };
      const C = { x: 380, y: 280 };
      const A = { x: 250, y: 90 };
      const P = [A, B, C];
      g.appendChild(polygon(P));
      const H = footOfPerpendicular(A, B, C).point;
      g.appendChild(line(A, H, { stroke: palette.altitude, width: 2.5 }));
      g.appendChild(rightAngleMark(H, C, A, { size: 13, stroke: palette.altitude }));
      g.appendChild(dot(H, { fill: palette.altitude }));
      annotateVertices(g, P, ["A", "B", "C"], ctx);
      if (ctx.showLabels) g.appendChild(label({ x: H.x, y: H.y + 20 }, "H", { fill: palette.altitude }));
      return g;
    },
  });

  add({
    id: "external-altitude",
    name: "External altitude",
    category: "Triangles",
    description: "In an obtuse triangle the foot H lies outside the base; the side is extended with a dotted line.",
    draw(ctx) {
      const g = group();
      const B = { x: 210, y: 250 };   // obtuse angle here
      const C = { x: 400, y: 250 };
      const A = { x: 150, y: 110 };
      const P = [A, B, C];
      g.appendChild(polygon(P));
      const H = footOfPerpendicular(A, B, C).point; // falls left of B (outside)
      // dotted extension of side CB beyond B out to H
      g.appendChild(line(B, H, { stroke: palette.helper, width: 2, dash: "5 5" }));
      // the altitude in color
      g.appendChild(line(A, H, { stroke: palette.altitude, width: 2.5 }));
      g.appendChild(rightAngleMark(H, B, A, { size: 13, stroke: palette.altitude }));
      g.appendChild(dot(H, { fill: palette.altitude }));
      annotateVertices(g, P, ["A", "B", "C"], ctx);
      if (ctx.showLabels) g.appendChild(label({ x: H.x, y: H.y + 20 }, "H", { fill: palette.altitude }));
      return g;
    },
  });

  add({
    id: "colored-altitudes",
    name: "Colored altitudes",
    category: "Triangles",
    description: "All three altitudes drawn in distinct colors; they meet at the orthocenter.",
    draw(ctx) {
      const g = group();
      const A = { x: 230, y: 80 };
      const B = { x: 110, y: 285 };
      const C = { x: 390, y: 270 };
      const P = [A, B, C];
      g.appendChild(polygon(P));
      const colors = [palette.altitude, palette.altitude2, palette.altitude3];
      const feet = [
        footOfPerpendicular(A, B, C).point,
        footOfPerpendicular(B, C, A).point,
        footOfPerpendicular(C, A, B).point,
      ];
      [ [A, feet[0]], [B, feet[1]], [C, feet[2]] ].forEach((seg, i) => {
        g.appendChild(line(seg[0], seg[1], { stroke: colors[i], width: 2.5 }));
        g.appendChild(dot(seg[1], { fill: colors[i], r: 2.8 }));
      });
      annotateVertices(g, P, ["A", "B", "C"], ctx);
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
    description: "Four right angles; opposite sides are equal (matching tick marks).",
    draw(ctx) {
      const g = group();
      const A = { x: 110, y: 110 }, B = { x: 390, y: 110 };
      const C = { x: 390, y: 260 }, D = { x: 110, y: 260 };
      const P = [A, B, C, D];
      g.appendChild(polygon(P));
      [A, B, C, D].forEach((v, i) => {
        const prev = P[(i + 3) % 4], next = P[(i + 1) % 4];
        g.appendChild(rightAngleMark(v, prev, next, { size: 13 }));
      });
      g.appendChild(tickMarks(A, B, 1));
      g.appendChild(tickMarks(D, C, 1));
      g.appendChild(tickMarks(B, C, 2));
      g.appendChild(tickMarks(A, D, 2));
      annotateVertices(g, P, ["A", "B", "C", "D"], ctx);
      return g;
    },
  });

  add({
    id: "square",
    name: "Square",
    category: "Quadrilaterals",
    description: "Four equal sides (single ticks) and four right angles.",
    draw(ctx) {
      const g = group();
      const s = 190, x0 = 150, y0 = 90;
      const A = { x: x0, y: y0 }, B = { x: x0 + s, y: y0 };
      const C = { x: x0 + s, y: y0 + s }, D = { x: x0, y: y0 + s };
      const P = [A, B, C, D];
      g.appendChild(polygon(P));
      P.forEach((v, i) => {
        const prev = P[(i + 3) % 4], next = P[(i + 1) % 4];
        g.appendChild(rightAngleMark(v, prev, next, { size: 13 }));
        g.appendChild(tickMarks(v, next, 1));
      });
      annotateVertices(g, P, ["A", "B", "C", "D"], ctx);
      return g;
    },
  });

  add({
    id: "quadrilateral",
    name: "Quadrilateral",
    category: "Quadrilaterals",
    description: "A general four-sided polygon with vertices A, B, C, D.",
    draw(ctx) {
      const g = group();
      const P = [
        { x: 100, y: 150 }, { x: 300, y: 90 },
        { x: 400, y: 240 }, { x: 170, y: 300 },
      ];
      g.appendChild(polygon(P));
      annotateVertices(g, P, ["A", "B", "C", "D"], ctx);
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
    description: "Two lines that never meet (matching arrow marks), cut by a transversal.",
    draw(ctx) {
      const g = group();
      const m1 = { x: 80, y: 140 }, m2 = { x: 420, y: 140 };
      const n1 = { x: 80, y: 250 }, n2 = { x: 420, y: 250 };
      g.appendChild(line(m1, m2, { width: 2.5, markerStart: "url(#arrow)", markerEnd: "url(#arrow)" }));
      g.appendChild(line(n1, n2, { width: 2.5, markerStart: "url(#arrow)", markerEnd: "url(#arrow)" }));
      g.appendChild(parallelMarks(m1, m2, 1));
      g.appendChild(parallelMarks(n1, n2, 1));
      // transversal
      g.appendChild(line({ x: 150, y: 100 }, { x: 330, y: 290 }, { stroke: palette.accent, width: 2 }));
      if (ctx.showLabels) {
        g.appendChild(label({ x: 440, y: 140 }, "m", { italic: true }));
        g.appendChild(label({ x: 440, y: 250 }, "n", { italic: true }));
      }
      return g;
    },
  });

  add({
    id: "parallelogram",
    name: "Parallelogram",
    category: "Parallels & Parallelograms",
    description: "Both pairs of opposite sides parallel and equal.",
    draw(ctx) {
      const g = group();
      const A = { x: 110, y: 260 }, B = { x: 310, y: 260 };
      const C = { x: 390, y: 110 }, D = { x: 190, y: 110 };
      const P = [A, B, C, D];
      g.appendChild(polygon(P));
      g.appendChild(parallelMarks(A, B, 1));
      g.appendChild(parallelMarks(D, C, 1));
      g.appendChild(parallelMarks(B, C, 2));
      g.appendChild(parallelMarks(A, D, 2));
      g.appendChild(tickMarks(A, B, 1));
      g.appendChild(tickMarks(D, C, 1));
      annotateVertices(g, P, ["A", "B", "C", "D"], ctx);
      return g;
    },
  });

  add({
    id: "rhombus",
    name: "Rhombus",
    category: "Parallels & Parallelograms",
    description: "A parallelogram with all four sides equal (single ticks).",
    draw(ctx) {
      const g = group();
      const A = { x: 130, y: 260 }, B = { x: 330, y: 260 };
      const C = { x: 410, y: 130 }, D = { x: 210, y: 130 };
      const P = [A, B, C, D];
      g.appendChild(polygon(P));
      P.forEach((v, i) => g.appendChild(tickMarks(v, P[(i + 1) % 4], 1)));
      g.appendChild(parallelMarks(A, B, 1));
      g.appendChild(parallelMarks(D, C, 1));
      g.appendChild(parallelMarks(B, C, 2));
      g.appendChild(parallelMarks(A, D, 2));
      annotateVertices(g, P, ["A", "B", "C", "D"], ctx);
      return g;
    },
  });

  add({
    id: "parallelogram-altitudes",
    name: "Altitudes of a parallelogram",
    category: "Parallels & Parallelograms",
    description: "Heights to two different bases, drawn in color with right-angle feet.",
    draw(ctx) {
      const g = group();
      const A = { x: 110, y: 270 }, B = { x: 320, y: 270 };
      const C = { x: 400, y: 120 }, D = { x: 190, y: 120 };
      const P = [A, B, C, D];
      g.appendChild(polygon(P));
      // height onto base AB from D
      const H1 = footOfPerpendicular(D, A, B).point;
      g.appendChild(line(D, H1, { stroke: palette.altitude, width: 2.5 }));
      g.appendChild(rightAngleMark(H1, B, D, { size: 12, stroke: palette.altitude }));
      g.appendChild(dot(H1, { fill: palette.altitude, r: 2.8 }));
      // height onto base AD from B (extend AD dotted if foot outside)
      const foot2 = footOfPerpendicular(B, A, D);
      const H2 = foot2.point;
      if (foot2.t < 0 || foot2.t > 1) {
        g.appendChild(line(foot2.t < 0 ? A : D, H2, { stroke: palette.helper, width: 2, dash: "5 5" }));
      }
      g.appendChild(line(B, H2, { stroke: palette.altitude2, width: 2.5 }));
      g.appendChild(rightAngleMark(H2, A, B, { size: 12, stroke: palette.altitude2 }));
      g.appendChild(dot(H2, { fill: palette.altitude2, r: 2.8 }));
      annotateVertices(g, P, ["A", "B", "C", "D"], ctx);
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
    description: "Exactly one pair of parallel sides (the bases), shown with arrow marks.",
    draw(ctx) {
      const g = group();
      const A = { x: 100, y: 270 }, B = { x: 400, y: 270 };
      const C = { x: 330, y: 120 }, D = { x: 180, y: 120 };
      const P = [A, B, C, D];
      g.appendChild(polygon(P));
      g.appendChild(parallelMarks(A, B, 1)); // bottom base
      g.appendChild(parallelMarks(D, C, 1)); // top base
      annotateVertices(g, P, ["A", "B", "C", "D"], ctx);
      return g;
    },
  });

  add({
    id: "trapezoid-altitude",
    name: "Altitude of a trapezoid",
    category: "Trapezoids",
    description: "The height: perpendicular distance between the two parallel bases.",
    draw(ctx) {
      const g = group();
      const A = { x: 100, y: 270 }, B = { x: 400, y: 270 };
      const C = { x: 330, y: 120 }, D = { x: 180, y: 120 };
      const P = [A, B, C, D];
      g.appendChild(polygon(P));
      g.appendChild(parallelMarks(A, B, 1));
      g.appendChild(parallelMarks(D, C, 1));
      const H = footOfPerpendicular(D, A, B).point;
      g.appendChild(line(D, H, { stroke: palette.altitude, width: 2.5 }));
      g.appendChild(rightAngleMark(H, B, D, { size: 12, stroke: palette.altitude }));
      g.appendChild(dot(H, { fill: palette.altitude, r: 2.8 }));
      if (ctx.showLabels) g.appendChild(label({ x: H.x - 12, y: (H.y + D.y) / 2 }, "h", { fill: palette.altitude, italic: true }));
      annotateVertices(g, P, ["A", "B", "C", "D"], ctx);
      return g;
    },
  });

  // ============================================================
  // 3D SOLIDS
  // ============================================================
  // Oblique projection box. front top-left at (x,y), size w x h, depth vector d.
  function drawBox(g, x, y, w, h, d, ctx, label3d) {
    // front face (z=0)
    const FTL = { x, y }, FTR = { x: x + w, y };
    const FBR = { x: x + w, y: y + h }, FBL = { x, y: y + h };
    // back face (shifted by depth vector d)
    const BTL = V.add(FTL, d), BTR = V.add(FTR, d);
    const BBR = V.add(FBR, d), BBL = V.add(FBL, d);
    // hidden edges (incident to back-bottom-left) dashed, drawn first
    const hidden = { stroke: palette.helper, width: 1.6, dash: "5 4" };
    g.appendChild(line(BBL, BBR, hidden));
    g.appendChild(line(BBL, BTL, hidden));
    g.appendChild(line(FBL, BBL, hidden));
    // visible depth edges
    g.appendChild(line(FTL, BTL, { width: 2 }));
    g.appendChild(line(FTR, BTR, { width: 2 }));
    g.appendChild(line(FBR, BBR, { width: 2 }));
    // back visible edges
    g.appendChild(line(BTL, BTR, { width: 2 }));
    g.appendChild(line(BTR, BBR, { width: 2 }));
    // front face
    g.appendChild(polygon([FTL, FTR, FBR, FBL], { width: 2.2, fill: "rgba(37,99,235,0.06)" }));
    if (ctx.showLabels && label3d) {
      g.appendChild(label(V.add(centroid([FTL, FTR, FBR, FBL]), { x: 0, y: 0 }), "", {}));
    }
    return { FTL, FTR, FBR, FBL, BTL, BTR, BBR, BBL };
  }

  add({
    id: "parallelepiped",
    name: "Rectangular parallelepiped",
    category: "3D Solids",
    description: "A box (cuboid): 6 rectangular faces. Hidden edges are dashed.",
    draw(ctx) {
      const g = group();
      const V3 = drawBox(g, 120, 150, 210, 130, { x: 70, y: -55 }, ctx, false);
      if (ctx.showLabels) {
        g.appendChild(label({ x: 225, y: 300 }, "length", { size: 13, fill: palette.helper, weight: 500 }));
        g.appendChild(label({ x: 100, y: 225 }, "height", { size: 13, fill: palette.helper, weight: 500, anchor: "end" }));
        g.appendChild(label({ x: 380, y: 150 }, "depth", { size: 13, fill: palette.helper, weight: 500, anchor: "start" }));
      }
      return g;
    },
  });

  add({
    id: "cube",
    name: "Cube",
    category: "3D Solids",
    description: "A parallelepiped with all edges equal (12 congruent square faces edges).",
    draw(ctx) {
      const g = group();
      drawBox(g, 130, 160, 170, 170, { x: 60, y: -60 }, ctx, false);
      if (ctx.showLabels) {
        g.appendChild(tickMarks({ x: 130, y: 160 }, { x: 300, y: 160 }, 1));
        g.appendChild(tickMarks({ x: 300, y: 160 }, { x: 300, y: 330 }, 1));
        g.appendChild(tickMarks({ x: 300, y: 160 }, { x: 360, y: 100 }, 1));
      }
      return g;
    },
  });

  global.Figures = figures;
})(window);
