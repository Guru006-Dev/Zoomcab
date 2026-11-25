# Night Ride 3D Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the landing page's 2D hero and story with a scroll driven 3D night ride across Coimbatore.

**Architecture:** City data is fitted once by a script. A pure timeline module turns scroll progress into story state, with tests. A `three` scene draws that state, and a React section owns scrolling, captions, sound and fallbacks.

**Tech Stack:** React 19, Vite 7, Vitest, canvas 2D (existing fallback). New: `three`.

**Spec:** [2026-11-25-night-ride-3d-design.md](../specs/2026-11-25-night-ride-3d-design.md)

**Reference:** the approved look is the throwaway test at `../spike-3d/index.html` (beside the repo folder). Take colours, sizes, camera shots and shader from it; rewrite the code, do not paste it.

## Global Constraints

- `three` and the models load only for the landing page's film, by dynamic import. Models under 4 MB in total.
- No requests to other hosts for 3D code, data or models.
- Roads: kerbs and centre lines; widths 6 m and 13 m; route and taxis on the road surface; no building covers a road.
- Sound off until clicked; paused with the tab; nothing said only in sound.
- Reduced motion: camera cuts, no flicker or pulsing. Failure flash at most 3 times a second.
- Credits: "© OpenStreetMap contributors", "Buildings by Kenney (CC0)"; the city is called "stylised".
- Copy has no hyphens or dashes. No claim that the rider "never noticed" a failure.
- Commits carry no Claude attribution. Commands run in `frontend/`.

## Review Focus

1. Visitor scrolls fast or jumps to the end: state matches the position, with no skipped or stuck captions (Task 2).
2. A model or data file fails to load: headline, buttons and the 2D hero still work (Task 4).
3. Leaving the page and coming back: no second renderer, sound or animation loop left running (Task 4).
4. Window resized across the narrow breakpoint: exactly one of film or 2D hero is shown (Task 4).
5. WebGL context lost: falls back to the 2D hero, no black screen (Task 4).

## Files

```
frontend/
  scripts/export-buildings.mjs     footprints from OpenStreetMap, fitted to clear roads
  public/kit/                      28 Kenney GLB models, Textures/, License.txt
  src/landing/film/
    fit.js city.json               road clearance and its output
    timeline.js                    scroll progress to story state
    scene.js city3d.js taxi.js     three.js drawing
    sound.js Film.jsx film.css     page section
    *.test.js
```

---

### Task 1: City data

**Interfaces:** Produces `fitBuildings(roads, footprints) -> Array<{x, y, angle, w, d, h, type}>` (metres; `type` 0 to 13; `h` 0 when unknown) and `city.json` as `{ spots: number[][] }` in that field order.

- [ ] Failing tests in `fit.test.js`: a 20 by 20 footprint centred on a 13 m road is removed; one 12 m from the road centre is narrowed so its edge is at least 7.5 m away; a distant one is unchanged; for the real `city.json`, no spot's box lies within 7.5 m (major) or 4 m (minor) of any road sample taken every 2 m.
- [ ] Run `npm test`; expect failure. Implement `fit.js` (longest wall sets `angle`; box spans the footprint; drop boxes under 4 m).
- [ ] `export-buildings.mjs`: Overpass `way["building"]` in bbox `10.998,76.945,11.028,76.980`, projected as `export-roads.mjs` does, User Agent `roads-export`; writes `city.json`.
- [ ] Run it, then `npm test`; expect pass and `city.json` under 600 KB.
- [ ] Copy the building GLBs, `Textures/` and `License.txt` from the Kenney kit into `public/kit/`; check `du -sh public/kit` is under 4 MB.
- [ ] Commit: `Add fitted city data and building models`.

### Task 2: Story timeline

**Interfaces:** Consumes `sim/graph.js`, `sim/match.js`. Produces `SCENES: Array<{title, detail}>` (7), `createRide(graph) -> {approach, trip, loserStart, pickup, dropoff}` and `stateAt(ride, progress) -> {scene, s, car:{x,y,heading}, matched, rivalRefused, rivalOpacity, othersOpacity, fault, showPickup}` where `progress` is 0 to 1 and `s = progress * 6`.

- [ ] Failing tests: `stateAt(ride,0).scene === 0`; at 1, scene 6 and the car is at the dropoff; scene 2 has `matched` and `rivalRefused`; scene 3 has `othersOpacity <= 0.1`; `fault` is 1 at `4/6` and 0 at `2/6` and 1; every car position over 101 steps is within 0.5 m of a road edge; calling with 0.8 then 0.2 gives the same result as 0.2 alone; progress below 0 or above 1 is clamped.
- [ ] Run; expect failure. Implement with the scene titles from the spec's table. Run; expect pass.
- [ ] Commit: `Add night ride timeline`.

### Task 3: 3D scene

**Interfaces:** Consumes `city.json`, `stateAt`. Produces `createScene(canvas, {graph, spots, reduced}) -> Promise<{render(state, now), resize(w, h), dispose()}>`.

- [ ] `npm i three`.
- [ ] `city3d.js`: instanced Kenney models (detailed within 300 m of the pickup and 300 m of the dropoff), road ribbons with kerbs, dashes and junction discs, streetlights, trees clear of roads.
- [ ] `taxi.js`: rounded block taxi with ring; `scene.js`: lights, fog, seven camera shots, bloom, failure darkening, `dispose()` releasing renderer, geometries, materials and textures.
- [ ] `npm run lint && npm run build`; expect `three` only in a lazily loaded chunk. Commit: `Add 3D city scene`.

### Task 4: Film section

**Interfaces:** Consumes `createScene`, `stateAt`, existing `Hero`. Produces `<Film ref />` exposing `watch()` (scrolls to the second scene).

- [ ] Failing test `film.test.js` for `canFilm({width, webgl}) -> boolean`: false under 900 px or without WebGL.
- [ ] Implement: 700vh track with a sticky canvas; captions as real text; headline "Watch a ride find its driver" and the action buttons readable while loading, with a progress note; "Skip the film" link first; fallback to `Hero` when `canFilm` is false, loading throws, or `webglcontextlost` fires; stop the loop off screen and `dispose()` on unmount.
- [ ] Browser check at 1440 and 375 px; block `kit/*` once to see the fallback; go to `/login` and back and confirm one canvas.
- [ ] Lint, build, commit: `Add scroll driven film`.

### Task 5: Sound

**Interfaces:** Produces `createSound() -> {toggle(): Promise<boolean>, cue(scene), dispose()}`.

- [ ] Failing test with a fake `AudioContext`: no context is created before `toggle()`; `cue` is silent while off; `dispose` closes the context.
- [ ] Implement a low hum and one cue per scene; "Sound off" / "Sound on" button with `aria-pressed`; suspend on `visibilitychange`.
- [ ] Tests, lint, commit: `Add optional film sound`.

### Task 6: Page assembly

- [ ] `Landing.jsx` renders `Film` first; remove `sections/Story.jsx`, `sections/Tagline.jsx` and their styles; keep screenshots, build section, end and footer; "How it works" points at the film.
- [ ] Add both credits and "stylised city" to the footer; update the README landing note and `og.png`.
- [ ] `npm test && npm run lint && npm run build`; commit: `Put the night ride on the landing page`.

### Task 7: Whole page check

- [ ] At 1440 px on integrated graphics, every scene holds at least 45 frames a second; record the numbers.
- [ ] Reduced motion cuts between scenes; keyboard reaches every control; no console errors; `/login` and `/home` unchanged.
- [ ] Fresh review of the branch diff; fix Critical and Important findings with a failing test where possible.
- [ ] Hand to the user to watch with sound on and approve the pacing.
