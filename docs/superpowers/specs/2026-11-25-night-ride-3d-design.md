# Landing page v2: the night ride in 3D

Replaces the 2D hero and story of `2026-11-25-landing-page-design.md`. Everything in that design
that is not restated here (routes, actions, facts the page may claim) still holds.

## Intent
A recruiter scrolls through one night ride across Coimbatore, like a short film they control, and
comes away knowing Zoomcab is a real distributed system. A throwaway test proved the look.

## Goals
- One full screen 3D city; scrolling moves the camera through the ride.
- A dispatcher narrates in first person, a few words per scene.
- Each scene shows one real behaviour of the system.
- Optional sound.

## Non-goals
- Photographic realism.
- Tuning for phones (the user's call). Hosting. Redesigning the app screens.

## Anti-goals
- Copying another site's look, words or characters.
- Presenting invented things as real, or claiming behaviour that has not been shown.
- A blank screen while the city loads.

## Approaches
City source:
| | Approach | Trade-off |
|---|---|---|
| **A (chosen)** | Our real streets and building positions, with Kenney's CC0 building models | Real layout, richer buildings; game-like style |
| B | A downloaded city scene | More detail; not Coimbatore, routes would need rebuilding |
| C | Google photorealistic tiles | Real buildings; billing, key, coverage unconfirmed |

The user picked A after seeing both plain and Kenney buildings.

## The film
| Scene | Dispatcher says | On screen |
|---|---|---|
| 1 | "Scroll." | High over the city |
| 2 | "11:42. You tap." | Dive to the pickup |
| 3 | "Two say yes. I keep one." | Two taxis; green ring 200, orange ring 409 |
| 4 | "Nobody else hears a word." | Follow your taxi; other taxis fade |
| 5 | "My lead server dies." | Windows and streetlights black out, city turns red |
| 6 | "Another takes over." | Lights return |
| 7 | "You arrive." | Camera rises; tagline and buttons |

Scenes 5 and 6 are labelled as showing leader election only. The page says the rider "never
noticed" only after the Docker cluster has been run and a server killed during a ride.

After the film, the page keeps the app screenshots, "How it is built" with known limits, and
the footer. The tagline reveal and 2D story are removed.

## The city
- Real roads and 12,828 building footprints from OpenStreetMap. Heights, building styles, road
  widths, trees and streetlights are invented, and the page says "stylised".
- Buildings never cover a road; ones that cannot fit are dropped.
- Detailed models near the close-up shots, simple ones elsewhere.
- Taxis are the block models built in code. A downloaded model may replace them later.
- Lit windows, streetlights and soft glow for the night look.
- Prepare the city data once, at build time, not in the visitor's browser.

## Behaviour
- Scroll sets the story position, so scrolling back rewinds it. The ride uses the existing
  routing and matching modules, which keep their tests.
- Sound is off until clicked, generated in the browser, pauses with the tab, and carries no
  information that is not also on screen.
- Reduced motion: the camera cuts between scenes; no flicker or pulsing.
- Server failure flashes no faster than three times a second.
- Keyboard scrolling works; every line is real text; a "Skip the film" link is first.
- While loading: the headline, buttons and a progress note are already readable.
- No WebGL, or a narrow screen: show the existing 2D map hero instead. *(My call: it is already
  built, so phones get something working at little cost.)*

## Credits
"© OpenStreetMap contributors" and "Buildings by Kenney (CC0)".

## Done when
- On a desktop with integrated graphics the film holds at least 45 frames a second.
- The 3D code and models load only on the landing page; models total under 4 MB.
- Lint, tests and build pass. Sign in and the app screens are unchanged.
- The user has watched it with sound on and approved the pacing.

## Left to the builder
Camera path and easing, exact sounds, how the code is split, data format.

## Open
- Better sound and moving background traffic are wanted but may come after the first version.
- Branch `feat/landing-page` is stacked on pull request 8, still open when last checked.
