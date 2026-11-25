# Landing Page ("the live city") Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A landing page at `/` that shows Zoomcab's matching on a playable, simulated map of Coimbatore.

**Architecture:** Pure simulation modules (graph, matching, world) with unit tests, drawn by one canvas component, composed into page sections under `frontend/src/landing/`. Road data is exported once from OpenStreetMap into a static JSON file. All pages are loaded lazily so the landing page does not pull in app code.

**Tech Stack:** React 19, Vite 7, framer-motion (already installed), canvas 2D. New: `vitest` (dev), `@phosphor-icons/react`, `@fontsource-variable/geist`.

**Spec:** [2026-11-25-landing-page-design.md](../specs/2026-11-25-landing-page-design.md)

## Global Constraints

- No backend calls and no map requests at run time. Fonts are bundled.
- Backgrounds flat `#000000` / `#181818`; no background gradients. Hero heading may use a `#FFFFFF` to `#9B9B9B` text gradient.
- Geist only, weight 600 at most, no italics. Phosphor icons only. No emoji.
- Accent `#5B4FE8` (lighter tint where contrast needs it); green only for "matched".
- Sentence case. No hyphens or dashes inside page copy. No invented users, numbers or reviews.
- All styles scoped under `.lp`; app screens must look unchanged.
- Map labelled "Simulation"; credit "© OpenStreetMap contributors" with a link to openstreetmap.org/copyright.
- Claims limited to the README, including: payments simulated, one Postgres instance, Docker cluster not run end to end.
- No sideways scroll at 375px or 1440px.
- Commit messages carry no Claude attribution.
- All commands below run in `frontend/`.

## Review Focus

1. Visitor taps while a ride is already running: the new ride replaces it cleanly, with no stuck or duplicate driver (Task 3).
2. Tap far from any road, or on a point with no route: snaps to the connected road network; a ride is never left searching forever (Task 2).
3. Window resize or phone rotation: map redraws sharply and taps still land where touched (Task 4).
4. Tab hidden for minutes, then shown: cars do not jump or race to catch up (Task 3).
5. Signed out user following an old bookmark or sign out button: lands on a working sign in form (Task 1).

## Files

```
frontend/
  scripts/export-roads.mjs          one off OpenStreetMap export
  src/landing/
    Landing.jsx  landing.css        page composition and scoped styles
    sim/graph.js match.js world.js  pure logic (+ *.test.js beside each)
    sim/roads.json                  generated
    CityMap.jsx drawScene.js        canvas component and drawing
    sections/Nav Hero Story Tagline AppShots Build Footer (.jsx)
    shots/*.webp                    app screenshots
```

---

### Task 1: Routes, lazy loading and test setup

**Files:** Modify `src/App.jsx`, `src/components/{PageLayout,SideMenu}.jsx`, `src/pages/{Home,DriverDashboard,Settings,NotFound}.jsx`, `package.json`, `.github/workflows/ci.yml`. Create `src/landing/Landing.jsx`, `src/routes.test.js`.

**Interfaces:** Produces: default export `Landing`; `npm test` runs `vitest run`.

- [ ] Install: `npm i @phosphor-icons/react @fontsource-variable/geist && npm i -D vitest`; add script `"test": "vitest run"`.
- [ ] Write the failing test in `src/routes.test.js`:

```js
import { readFileSync } from 'node:fs';
import { test, expect } from 'vitest';
const src = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');

test('landing is at / and sign in at /login', () => {
  expect(src('./App.jsx')).toMatch(/path="\/" element=\{<Landing \/>\}/);
  expect(src('./App.jsx')).toMatch(/path="\/login" element=\{<Login \/>\}/);
});
test('nothing signs out to the landing page', () => {
  for (const f of ['./components/PageLayout.jsx', './components/SideMenu.jsx', './pages/Home.jsx',
    './pages/DriverDashboard.jsx', './pages/Settings.jsx']) {
    expect(src(f)).not.toMatch(/navigate\('\/'\)/);
  }
  expect(src('./pages/NotFound.jsx')).toContain('to="/login"');
});
```

- [ ] Run `npm test`; expect both to fail.
- [ ] In `App.jsx`, load every page with `React.lazy` inside one `Suspense` (fallback: empty `div`); add the two routes. Point the five sign out calls and the 404 link at `/login`. `Landing` is a `<main className="lp">` placeholder.
- [ ] CI frontend job: add `- run: npm test` after lint.
- [ ] Run `npm test && npm run lint && npm run build`; expect pass, 0 lint errors, and separate chunks for Landing and Login.
- [ ] Commit: `Move sign in to /login and add the landing route`.

### Task 2: Road data and graph

**Files:** Create `scripts/export-roads.mjs`, `src/landing/sim/{roads.json,graph.js,graph.test.js}`.

**Interfaces:** Produces:
- `roads.json`: `{ width, height, nodes: [[x, y]], edges: [[a, b, major]] }`, metres, y down, `major` 0 or 1.
- `buildGraph(data) -> { width, height, nodes, edges, adj }`
- `nearestNode(graph, x, y) -> number`
- `shortestPath(graph, from, to) -> number[] | null`

- [ ] Write failing tests on a fixture `{width:100,height:100,nodes:[[0,0],[10,0],[10,10],[90,90]],edges:[[0,1,1],[1,2,0]]}`:

```js
expect(shortestPath(g, 0, 2)).toEqual([0, 1, 2]);
expect(shortestPath(g, 0, 0)).toEqual([0]);
expect(shortestPath(g, 0, 3)).toBeNull();
expect(nearestNode(g, 88, 88)).toBe(2); // node 3 is isolated, so never chosen
```

- [ ] Run `npm test`; expect failure. Implement: Dijkstra; `nearestNode` considers only the largest connected component. Run again; expect pass.
- [ ] Write the export script: Overpass query for `highway` in `motorway|trunk|primary|secondary|tertiary|residential|unclassified` inside bbox `10.998,76.945,11.028,76.980`; project to metres; keep the largest connected component; `major` for tertiary and above; round to whole metres. Generic User Agent `roads-export`.
- [ ] Run `node scripts/export-roads.mjs`; expect `roads.json` under 200 KB (if larger, drop `residential` ways under 80 m long).
- [ ] Add a test: every node of the real `roads.json` is reachable from `nearestNode(g, 0, 0)`.
- [ ] Commit: `Add Coimbatore road data and routing`.

### Task 3: Matching and world simulation

**Files:** Create `src/landing/sim/{match.js,match.test.js,world.js,world.test.js}`.

**Interfaces:** Consumes the graph functions. Produces:
- `nearestFreeDriver(graph, drivers, node) -> driver | null` (straight line distance, as the server does)
- `acceptRide(ride, driverId) -> { ride, status: 200 | 409 }`
- `recipients(ride) -> string[]`
- `createWorld(graph, { count = 12, seed = 1 }) -> world` with `world.drivers: [{id, x, y, status: 'free'|'busy'}]` and `world.ride: null | {phase: 'searching'|'to_pickup'|'to_dropoff'|'done', riderId:'rider', driverId, pickup, dropoff, path}`
- `requestRide(world, pickupNode, dropoffNode) -> world`
- `step(world, dtSeconds) -> world`

- [ ] Write failing tests:
  - busy drivers are skipped; no free driver returns `null`
  - first `acceptRide` gives 200, a second by another driver gives 409 and keeps the first `driverId`
  - `recipients` returns exactly `['rider', driverId]`
  - stepping a requested ride passes `searching`, `to_pickup`, `to_dropoff`, `done` and leaves the driver `free`
  - a second `requestRide` mid ride leaves exactly one `busy` driver
  - `step(world, 600)` moves each car no further than `step(world, 0.1)` would
  - the same seed gives the same positions
- [ ] Run `npm test`; expect failure. Implement (clamp `dt` to 0.1; idle drivers wander along edges; seeded random). Run; expect pass.
- [ ] Commit: `Add matching and city simulation`.

### Task 4: Map and hero

**Files:** Create `CityMap.jsx`, `drawScene.js`, `sections/{Nav,Hero}.jsx`, `landing.css`; modify `Landing.jsx`.

**Interfaces:** Produces `drawScene(ctx, graph, world, view, highlight)`; `<CityMap graph world running onPick={(node)=>{}} highlight />`; `<Hero />`; anchor ids `hero`, `how`.

- [ ] `CityMap`: size the canvas with `ResizeObserver` and `devicePixelRatio`; cover fit; convert taps with the same transform; `requestAnimationFrame` only while on screen (`IntersectionObserver`) and the tab visible. Reduced motion: no loop; draw once per ride phase and advance phases on a 1.2 s timer.
- [ ] `Hero`: heading "Watch a ride find its driver"; line "Zoomcab matches riders with the nearest free driver and updates only the two of them. Tap the map to try it."; buttons "View the code" (`https://github.com/Guru006-Dev/Zoomcab`) and "Watch a match". With `import.meta.env.VITE_DEMO_URL`, "Try the live demo" is first. Three destination buttons for keyboard users; `aria-live="polite"` status text; "Simulation" label.
- [ ] `Nav`: floating translucent bar with How it works, Code, Sign in (`/login`).
- [ ] Verify in the browser at 1440px and 375px: tap lands where touched before and after a resize; a ride completes; `document.documentElement.scrollWidth === innerWidth`.
- [ ] `npm run lint && npm run build`, then commit: `Add playable map hero`.

### Task 5: How it works story

**Files:** Create `sections/Story.jsx`; modify `Landing.jsx`, `landing.css`, `drawScene.js`.

**Interfaces:** Consumes `CityMap`, `nearestFreeDriver`, `acceptRide`, `recipients`.

- [ ] Pinned map with three steps chosen by `IntersectionObserver`: "The nearest driver gets the offer" (distance lines), "Two drivers accept, one wins" (labels `200` and `409`, from `acceptRide`), "Only two people hear about it" (rider and driver lit from `recipients`, others dimmed).
- [ ] Below 900px the map sits above each step instead of pinning.
- [ ] Verify each step in the browser at both widths and with reduced motion; lint, build, commit: `Add how it works story`.

### Task 6: Tagline, screenshots, build section, footer

**Files:** Create `sections/{Tagline,AppShots,Build,Footer}.jsx`, `shots/*.webp`; modify `Landing.jsx`, `landing.css`, `index.html`.

- [ ] Tagline: "One ride finds one driver." / "Only those two hear about it." Words go from 30% to full opacity as they cross a trigger line; reduced motion shows full text.
- [ ] Screenshots from the running frontend (rider home, driver dashboard, ride offer) at 390px wide, saved as WebP, with width, height, alt text and `loading="lazy"`. Skip any screen that needs the backend.
- [ ] Build: diagram in HTML (browsers, nginx, three API instances, Redis, Postgres with PostGIS); what CI runs; the three known limits.
- [ ] Footer: repeat the hero buttons, GitHub link, map credit.
- [ ] `index.html`: title "Zoomcab: watch a ride find its driver", meta description, `og:title`, `og:description`, `og:image` (a screenshot of the hero).
- [ ] Lint, build, commit: `Finish landing page sections`.

### Task 7: Whole page check

- [ ] `npm test && npm run lint && npm run build`: all pass.
- [ ] At 375px and 1440px: no sideways scroll, keyboard reaches every control with visible focus, no console errors, no requests to other hosts on load.
- [ ] `/login` signs in as before; `/home` looks unchanged.
- [ ] Run the project's design linters from the `web-design` skill on the page and fix findings.
- [ ] Add a "Landing page" line to the README; commit: `Document the landing page`.
