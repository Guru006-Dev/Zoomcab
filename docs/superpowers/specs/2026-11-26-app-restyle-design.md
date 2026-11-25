# App restyle: one product from landing to booking

## Intent
The landing page is a dark 3D night city; the app behind it is white with a different font,
emoji and a cartoon scene. A recruiter clicking through should feel they stayed in one product.

## Goals
- Every screen uses the landing page's colours, font and icon family.
- Moving from landing to sign in or sign up feels deliberate.
- The booking map has no "API key required" watermark.

## Non-goals
- New layouts, features or backend changes.
- A light theme. *(My call: dark only; the theme switch in Settings is removed.)*
- Phone tuning beyond keeping today's stacked layouts working.

## Anti-goals
- White patches or unreadable text left on any screen.
- Breaking sign in, booking or the driver flow.

## Approaches
| | Approach | Trade-off |
|---|---|---|
| **A (chosen)** | One shared theme; typed in colours replaced with it | Consistent and maintainable; layouts unchanged |
| B | Switch on the existing dark theme | Quick; white patches, fonts and artwork still differ |
| C | Rebuild screens | Best result; far more work and risk |

The user picked A.

## The theme
| Role | Value |
|---|---|
| Page | `#000000` |
| Panels | `#181818`, `#1F1F1F`, `#272727` |
| Borders | `#313131` |
| Accent | `#5B4FE8`, lighter `#8B82FF` for text on dark |
| Success | `#3DDC84` |
| Warning and danger | existing hues, adjusted for contrast |
| Font | Geist, weight 600 at most |
| Icons | Phosphor; emoji removed from interface text |

Flat backgrounds, no background gradients. Text meets 4.5 to 1 contrast. The values live in one
place and the landing page uses the same ones.

## Stages
Each stage is usable on its own and can be reviewed separately.
1. Shared theme and font; replace the map label layer that shows the watermark.
2. Sign in and sign up: a still image of the 3D city replaces the cartoon scene (and its
   third party download); **Sign up** link on the landing nav; a short fade between pages.
3. Booking, payment, ride acceptance, active ride and driver dashboard, with a dark map.
4. Remaining screens and popups.

## Behaviour
- `/login?mode=signup` opens the sign up tab.
- The fade is under 300 ms and is skipped with reduced motion.
- The map keeps readable street names and correct attribution, and needs no API key.
- Vehicle photos stay.

## Done when
- No screen has a white background panel; no emoji in interface text; one font everywhere.
- Lint, tests and build pass.
- Every screen has been viewed at 1440 and 375 px.
- Sign in, booking, accept and complete have been run against a live backend. Until then,
  stage 3 is reported as visually checked only.

## Needs the user
Booking and live rides need the backend with Postgres. Neither Docker nor Postgres was found on
this machine; installing one is the user's step, best done before stage 3.

## Left to the builder
How colours are replaced, the map tile source (free, no key), spacing and component details.

## Open
This branch is stacked on `feat/landing-page` (pull request 9).
