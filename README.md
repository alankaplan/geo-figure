# Geometric Figures

An interactive, dependency-free web app for drawing geometry figures. Every
figure is rendered as crisp SVG, so it stays sharp at any size and can be
downloaded individually.

## Running it

No build step and no dependencies — just open the app:

```
# from the project root
python3 -m http.server 8000
# then visit http://localhost:8000
```

Or simply open `index.html` directly in a browser.

## Features

- **Sidebar gallery** grouping figures by category.
- **Live controls panel** — every figure exposes adjustable options that redraw
  instantly. Depending on the figure you can:
  - toggle labels on/off and **rename any vertex, angle, side, or dimension**;
  - show/hide angle arcs, equal-side ticks, parallel marks, and right-angle marks;
  - **choose which altitude** to draw (from vertex A, B, or C) and pick its color;
  - toggle the dotted side-extension and right-angle foot mark;
  - select which of the three altitudes appear (colored altitudes);
  - toggle dashed hidden edges on the 3D solids, label all 8 cuboid vertices
    and its faces, and **set the edge lengths** of a sized parallelepiped;
  - Settings persist while you switch figures; **Reset** restores a figure's defaults.
- **Math / LaTeX-style labels** — any label accepts a small LaTeX subset:
  - `$...$` renders in an italic math font (e.g. `$A$`, `$\triangle ABC$`);
  - `_x` / `_{xy}` subscripts and `^x` / `^{xy}` superscripts (e.g. `A_1`, `90^\circ`);
  - `\`-commands for Greek letters and symbols (`\alpha`, `\beta`, `\angle`,
    `\triangle`, `\times`, `\cdot`, `\circ`, `\perp`, `\parallel`, …).

  It renders natively in SVG — no MathJax/KaTeX dependency — so the app stays
  self-contained and works offline.
- **Download SVG** to export the current figure as a standalone `.svg` file.

## Adding controls to a figure

Each figure declares a `controls` array of descriptors and reads the resolved
values from `ctx.p` inside `draw`. Available control types (see the `C` helpers
in `figures.js`): `toggle`, `text`, `number`, `select`, `checklist`, and `color`.
The app renders them automatically into the settings panel.

## Figures included

**Lines & Angles**
- Line segment
- Line ray
- Angle

**Triangles**
- Triangle (scalene)
- Equilateral triangle (equal-side ticks, 60° arcs)
- Isosceles triangle (equal legs, equal base angles)
- Annotated triangle (vertices A/B/C and angles α/β/γ)
- Right triangle (right-angle mark)
- Altitude of a triangle (internal, with foot H)
- External altitude (obtuse triangle; dotted side extension, colored altitude)
- Colored altitudes (all three altitudes meeting at the orthocenter)

**Quadrilaterals**
- Rectangle
- Square
- Quadrilateral (general)

**Parallels & Parallelograms**
- Parallel lines (with a transversal)
- Parallelogram
- Rhombus
- Altitudes of a parallelogram (two heights, colored)

**Trapezoids**
- Trapezoid
- Altitude of a trapezoid (the height)

**3D Solids**
- Rectangular parallelepiped (cuboid; hidden edges dashed; vertex + face labels)
- Parallelepiped (custom size) — set length/height/depth, edges labelled with values
- Cube (all three edges labelled)

## Project layout

| File | Purpose |
| --- | --- |
| `index.html` | Page shell and layout |
| `styles.css` | Styling |
| `geometry.js` | Vector math and SVG drawing helpers |
| `figures.js` | The figure registry (one entry per figure) |
| `app.js` | Sidebar, canvas rendering, and toolbar wiring |

Adding a new figure is a matter of appending one entry to `figures.js` with a
`draw(ctx)` function that returns an SVG group.
