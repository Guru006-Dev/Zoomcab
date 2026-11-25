# Landing page: "the live city"

## Intent
Zoomcab has no landing page; `/` is a sign-in form. The new page should show a recruiter or
interviewer, within about 30 seconds, that this is a real-time distributed system and not just
screens. A later goal is a releasable product, but this page speaks to recruiters first.

## Goals
- A hero the visitor can play with: pick a destination, watch a driver get matched.
- Explain three real behaviours: nearest-driver matching, two drivers racing to accept
  (one wins), updates reaching only that rider and driver.
- Look distinctly like Zoomcab, and work well on a phone.
- Run with no backend.

## Non-goals
- Redesigning the sign-in page or the app screens.
- A live connection to the backend (possible later).
- Hosting or deployment.
- Rider marketing: pricing, testimonials, app store links.

## Anti-goals (failure even if it works)
- Looking like a template: stock 3D, emoji icons, generic claims.
- Passing the simulation off as live data, or inventing users, numbers or reviews.
- A heavy page that is slow to show anything.

## Approaches
| | Approach | Trade-off |
|---|---|---|
| **A (chosen)** | Real Coimbatore roads drawn in our own style, cars simulated in the browser | Most distinctive, light, no server; most drawing work |
| B | Dark map library with animated cars | Quickest; looks like many ride apps |
| C | Cars and matches from the running backend | Strongest proof; needs hosting, breaks when down |

The user picked A.

## Page, in order
```
NAV      floating compact bar: logo, How it works, Code, Sign in
HERO     headline and buttons over the city map
STORY    pinned map, three scroll steps: nearest, race, private updates
TAGLINE  large two line statement, words brighten one by one on scroll
APP      screenshots of rider and driver screens
BUILD    architecture diagram, tests and CI, known limits
END      same buttons as hero; footer with GitHub link and map credit
```

## Actions
Nothing is hosted today, so a visitor to a static deploy could not sign in.
- Primary button: **View the code** (the GitHub repository).
- Secondary: **Watch a match** (starts a ride on the hero map).
- If the build sets `VITE_DEMO_URL`, **Try the live demo** becomes primary and View the code
  secondary.

## The map
- Road geometry for a few square kilometres of Coimbatore, exported once from OpenStreetMap by
  a script into a small static file. No map requests at run time. Credit OpenStreetMap
  contributors (ODbL) on the page.
- Drawn on a 2D canvas. Drivers move along roads. A tap or a destination button picks a point;
  the nearest free driver is found, drives to pickup, then to the destination.
- The race step shows two drivers accepting and one being refused, like the server's `409`.
- Labelled "Simulation" on screen.
- Simulation logic (nearest driver, one winner, who receives updates) is separate from drawing
  and has unit tests.
- Pauses when off screen or the tab is hidden.
- Keyboard users get the destination buttons; screen readers get a text status of the match.
- Reduced motion: no continuous movement; each state is shown as a still frame.

## Look
- Flat dark background (`#000000` / `#181818`), no background gradients.
- One typeface, Geist. Phosphor icons. One accent: Zoomcab violet `#5B4FE8`, lightened where
  needed for contrast; green only for "matched".
- Hero heading may use a white to grey text gradient.
- Landing styles are scoped so the app screens do not change.

## Routes
- `/` becomes the landing page; sign-in moves to `/login`.
- Sign out, the 404 link and the side menu go to `/login`.
- The landing page is loaded separately from the app code, and does not load the 3D scene.

## Facts the page may claim
Only what the README supports, including its limits: simulated payments, one Postgres instance,
and a Docker cluster that has not been run end to end.

## Done when
- Works at 375px and 1440px with no sideways scroll.
- Lint, build and the new tests pass; CI runs those tests.
- The first screen shows headline, a button and the map without waiting on any third party
  other than fonts.
- Old sign-in and sign-out paths still work.

## Left to the builder
Wording, exact layout and spacing, motion details, how the map is split into files, test tool.

## Open limits
- Screenshots can only show screens that render without a backend; booking and live ride shots
  need the system running.
- This branch is stacked on `fix/ui-basics` (pull request 8, still open).
