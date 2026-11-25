# App Restyle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every app screen shares the landing page's dark theme, font and icons.

**Architecture:** One `theme.css` holds the values; screens read them through the existing CSS variables. A source scanning test lists the files already converted and fails on any light colour, emoji or old icon import in them, so each stage extends the list.

**Tech Stack:** React 19, Vite 7, Vitest, `@fontsource-variable/geist`, `@phosphor-icons/react` (both installed).

**Spec:** [2026-11-26-app-restyle-design.md](../specs/2026-11-26-app-restyle-design.md)

## Global Constraints

- Page `#000000`; panels `#181818`, `#1F1F1F`, `#272727`; borders `#313131`; accent `#5B4FE8`, `#8B82FF` for text on dark; success `#3DDC84`.
- Geist only, weight 600 at most. Phosphor icons. No emoji in interface text. No background gradients.
- Text contrast at least 4.5 to 1. Vehicle photos stay.
- No behaviour, API or layout changes beyond what the spec lists.
- Commits carry no Claude attribution. Commands run in `frontend/`.

## Review Focus

1. Text that was dark on a white card becomes unreadable on a dark one (every task: contrast check).
2. Popups that ignore variables (chat, rating, safety, ride request) stay white (Task 6).
3. Disabled, selected, hover, focus and error states vanish on dark (Tasks 3 to 5).
4. A saved light preference or the removed theme switch leaves a broken Settings row (Task 6).
5. Map markers, route line and popups become hard to see on the dark map (Task 4).

## Files

```
frontend/src/
  theme.css                 values, imported by index.css and landing.css
  theme.test.js             scans converted files
  components/{PageTransition,MapTiles}.jsx
  assets/city-night.webp    still of the 3D city
```

---

### Task 1: Theme, font and map tiles

**Interfaces:** Produces CSS variables (`--bg`, `--surface`, `--surface2`, `--surface3`, `--primary`, `--primary-text`, `--success`, `--text-1`..`--text-4`, `--border`, `--font`); `<MapTiles />` for use inside a `MapContainer`; in `theme.test.js`, an exported-in-file list `CONVERTED`.

- [ ] Write `theme.test.js`: `theme.css` contains each constraint value; every `--text-*` on `--surface` has contrast of at least 4.5; `index.css` has no `body.dark`; no source file contains `light_only_labels` or `World_Imagery`; every file in `CONVERTED` has no `#fff`/`white` backgrounds, no `linear-gradient(`, no emoji (`/\p{Extended_Pictographic}/u`) and no `lucide-react` import.
- [ ] Run `npm test`; expect failure.
- [ ] Create `theme.css`; set `--font` to `'Geist Variable'`; remove `body.dark` and the Plus Jakarta link in `index.html`.
- [ ] `MapTiles`: OpenStreetMap standard tiles (`https://tile.openstreetmap.org/{z}/{x}/{y}.png`, attribution `© OpenStreetMap contributors`) with a `.map-dark` CSS filter on the tile pane only. Use it in `Home`, `DriverDashboard`, `ActiveRideNavigation`.
- [ ] Verify in the browser that no watermark shows and street names are readable. Run tests and build; commit `Add the shared dark theme and a keyless map`.

### Task 2: Sign in, sign up and transition

**Interfaces:** Consumes the variables. Produces `<PageTransition>` (opacity fade, 200 ms, none with reduced motion).

- [ ] Add `pages/Login.jsx` to `CONVERTED`; add tests: `Login.jsx` reads `mode` from the query string; it has no `spline` import; the landing nav links to `/login?mode=signup`. Run; expect failure.
- [ ] Capture the 3D city's first scene as `assets/city-night.webp` (under 200 KB); restyle `Login` around it; remove the two Spline packages from `package.json`.
- [ ] Add the **Sign up** nav link and wrap routes in `PageTransition`.
- [ ] Browser check both tabs, both roles, error state, at 1440 and 375 px. Tests, lint, build; commit `Restyle sign in and sign up`.

### Task 3: Rider booking and payment

- [ ] Add `pages/Home.jsx` and `pages/Payment.jsx` to `CONVERTED`; run; expect failure.
- [ ] Replace typed in colours with variables, `lucide-react` icons and emoji with Phosphor.
- [ ] Browser check at both widths, including selected vehicle, disabled button, suggestions list and searching state. Tests, lint, build; commit `Restyle rider booking and payment`.

### Task 4: Driver and live ride screens

- [ ] Add `DriverDashboard`, `RideAcceptance`, `ActiveRideNavigation`, `components/DriverHUD`, `components/NavigationPlaceholder` to `CONVERTED`; run; expect failure.
- [ ] Convert them; recolour the route line and markers for the dark map.
- [ ] Browser check at both widths, online and offline. Tests, lint, build; commit `Restyle driver and live ride screens`.

### Task 5: Shared layout and remaining pages

- [ ] Add `components/PageLayout`, `components/SideMenu` and every remaining page to `CONVERTED`; run; expect failure.
- [ ] Convert them. Browser check each page at both widths. Tests, lint, build; commit `Restyle the remaining pages`.

### Task 6: Popups, settings and cleanup

- [ ] Add `InAppChat`, `RatingModal`, `SafetyModal`, `Badges`, `components/ui/*` to `CONVERTED`; add a test that `Settings.jsx` has no "Dark Mode" row. Run; expect failure.
- [ ] Convert them; remove the Dark Mode row and `ThemeToggle`; delete unused background components.
- [ ] `npm uninstall lucide-react` once nothing imports it. Tests, lint, build; commit `Restyle popups and remove the theme switch`.

### Task 7: Whole app check

- [ ] Screenshot every route at 1440 and 375 px; fix white patches and unreadable text.
- [ ] If Postgres is available, run sign in, book, accept and complete; otherwise report stages 3 and 4 as visually checked only.
- [ ] Fresh review of the branch diff; fix Critical and Important findings.
