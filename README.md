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
- **Labels toggle** to show/hide vertex names, angle marks, and dimension text.
- **Download SVG** to export the current figure as a standalone `.svg` file.

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
- Rectangular parallelepiped (cuboid; hidden edges dashed)
- Cube

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
