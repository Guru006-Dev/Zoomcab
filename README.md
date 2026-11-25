# Zoomcab

[![CI](https://github.com/Guru006-Dev/Zoomcab/actions/workflows/ci.yml/badge.svg)](https://github.com/Guru006-Dev/Zoomcab/actions/workflows/ci.yml)

A ride-hailing app built to practise distributed-systems techniques: nearest-driver matching with
Redis GEO, atomic driver assignment, leader election across backend instances, and real-time
updates with Socket.IO that reach only the rider and driver of each ride. It runs as one server
for development, or as three load-balanced instances with Docker Compose.

**Stack:** React 19 + Vite + Tailwind · Node.js + Express 5 · Socket.IO · Redis · PostgreSQL + PostGIS ·
Leaflet + OSRM routing · Google Gemini (concierge chatbot)

---



**Riders** pick a destination on the map, choose a vehicle and request a ride. The nearest free
driver gets the offer; the rider sees the driver accept and then move toward the pickup in real
time, pays, and rates the trip.

**Drivers** go online, share their location, and get ride offers with a 15-second countdown to
accept or decline. Declining passes the ride to the next nearest driver.

With nobody else online you can still try the rider flow: **demo mode** (on by default in
development) has a simulated driver accept after a few seconds and drive along a real road route.

## How the distributed parts work

| Problem | How Zoomcab handles it | Where |
|---|---|---|
| Find the nearest free driver | Drivers' positions are kept in a Redis GEO index; `GEORADIUS` returns candidates sorted by distance. Without Redis, a PostGIS query does it: `ST_DWithin` for the radius and KNN ordering (`<->`) on a GIST index. | `backend/rideMatchingService.js` |
| Never offer one driver two rides | A Lua script reserves the driver in Redis only if they are still `available`, and a conditional `UPDATE ... WHERE status = 'available'` does the same in Postgres. | `_reserveDriver` |
| Two drivers accept the same ride | `UPDATE rides ... WHERE id = $1 AND status = 'pending'` is atomic in Postgres, so exactly one driver gets `200` and the other gets `409`. | `acceptRide` |
| Overspending loyalty points | `UPDATE users ... WHERE loyalty_points >= $1` redeems in one statement, so concurrent redemptions can't go negative. | `backend/loyaltyService.js` |
| Several instances creating the schema at once | Startup migration runs under a Postgres advisory lock. | `backend/db.js` |
| Double-tapping "Book" | A per-rider lock (`SET ... NX EX 30` in Redis, in-memory without it). | `requestRide` |
| Events must reach only the right people | Each authenticated socket joins a private `user:<id>` room. With several instances, the Socket.IO Redis adapter forwards room events between them. | `backend/server.js` |
| Spoofed driver locations | The driver's identity comes from the JWT on the socket, never from the message payload. | `updateLocation` handler |
| Coordinating instances | Bully-style leader election: the highest live instance id leads; followers check its Redis heartbeat (15 s TTL) every 5 s and elect a new leader when it expires. | `backend/leaderElection.js` |
| Knowing which instances are alive | Service registry entries in Redis with TTL heartbeats. | `backend/serviceRegistry.js` |
| Reacting to ride events | Redis pub/sub event bus; the loyalty service awards points on `ride:completed`. | `backend/eventBus.js`, `backend/loyaltyService.js` |

Redis is optional: if it is down, matching, locking and acceptance keep working on Postgres alone
(single instance), and `GET /api/health` reports `"redis": "unavailable"`.

## Running it

### One server (development)

Needs Node.js 22 and Postgres with PostGIS. Redis is optional. The quickest way to get both
databases is Docker:

```bash
docker compose up -d postgres redis
```

```bash
cd backend
cp .env.example .env      # optional; sensible development defaults otherwise
npm install
npm run dev               # http://localhost:5000
```

```bash
cd frontend
npm install
npm run dev               # http://localhost:5173
```

Demo logins (created only outside production): **Guru / 123456** (rider) and
**Driver1 / password** (driver). Use a private window for the second user.

### Cluster (Docker Compose)

Postgres, Redis, three backend instances and nginx in front of them:

```bash
JWT_SECRET=$(openssl rand -hex 32) docker compose up --build   # http://localhost:8080
```

See [deploy/README.md](deploy/README.md) for the checks to run, including stopping the leader
and watching another instance take over.

## Configuration

All settings are environment variables; [backend/.env.example](backend/.env.example) lists them.

| Variable | Default | Purpose |
|---|---|---|
| `JWT_SECRET` | dev placeholder | **Required in production**; the server refuses to start without it |
| `REDIS_HOST` / `REDIS_PORT` | `127.0.0.1` / `6379` | Redis connection |
| `DATABASE_URL` | `postgres://zoomcab:zoomcab@localhost:5432/zoomcab` | Postgres with PostGIS |
| `INSTANCE_ID` | `instance-<pid>` | Unique id per instance, used in leader election |
| `DEMO_MODE` | on outside production | Simulated driver for solo testing |
| `SEED_DEMO_USERS` | on outside production | Create the demo logins on startup |
| `CORS_ORIGIN` | `*` | Allowed frontend origin |
| `GEMINI_API_KEY` | — | Enables the AI concierge chat |

## Tests

```bash
docker compose up -d postgres        # add redis to also run the Redis-only tests
cd backend && npm test
```

The suite resets the database, starts the real server on a random port, and drives it with
HTTP calls and Socket.IO clients: nearest-driver offers, decline and re-offer, the
simultaneous-accept race, that bystanders receive no events, that a driver can't fake another
driver's location, access control, loyalty points (including concurrent redemption), reviews,
and config. Leader election, failover and loyalty-event tests run when Redis is available.

CI runs on every push and pull request: backend tests against Postgres, backend tests against
Postgres and Redis, and the frontend lint and build.

## API

| Method | Path | Who | What |
|---|---|---|---|
| `POST` | `/api/auth/register` | anyone | Create a rider or driver |
| `POST` | `/api/auth/login` | anyone | Returns a JWT and the user |
| `POST` | `/api/rider/request-ride` | rider | Create a ride and offer it to the nearest driver |
| `GET` | `/api/rider/ride-status/:id` | rider or assigned driver | Ride details |
| `POST` | `/api/driver/location` | driver | Update position |
| `POST` | `/api/driver/accept-ride/:id` | driver | Accept (`409` if someone else won) |
| `POST` | `/api/driver/reject-ride/:id` | driver | Decline; re-offers to the next driver |
| `POST` | `/api/driver/complete-ride/:id` | assigned driver | Finish the ride |
| `GET` | `/api/loyalty/points` | logged in | Your loyalty points |
| `POST` | `/api/loyalty/redeem` | logged in | Spend points (fails if the balance is too low) |
| `POST` | `/api/rating/submit` | rider | Review the driver of your completed ride, once |
| `GET` | `/api/rating/driver/:id` | anyone | Average rating and recent reviews |
| `GET` | `/api/health` | anyone | Instance id, Redis status, current leader |

**Socket.IO events** (authenticate with `auth: { token }`): drivers send `updateLocation`;
riders receive `rideAccepted`, `rideUpdate`, `driverLocationUpdate`, `rideCompleted`,
`noDriversAvailable`; drivers receive `newRideRequest`, `rideOfferWithdrawn`, `paymentCompleted`.

## Project layout

```
backend/
  server.js               Express + Socket.IO setup, rooms, demo mode, cluster startup
  db.js                   Postgres pool, schema migration, PostGIS helpers
  rideMatchingService.js  Request / offer / accept / decline / complete, locking, Redis GEO
  leaderElection.js       Leader election with Redis heartbeats
  serviceRegistry.js      Instance registry with TTL heartbeats
  eventBus.js             Redis pub/sub
  routes/                 auth, rider, driver, loyalty, rating
  chatbot/                Gemini concierge
  tests/                  Jest integration and unit tests
frontend/src/
  api.js                  REST client and Socket.IO connection
  pages/                  Home (rider map), DriverDashboard, RideAcceptance, Payment, …
deploy/                   nginx config and cluster guide
docker-compose.yml        Postgres + Redis + 3 API instances + nginx
```

## Known limitations

- **One Postgres instance.** All backend instances share it; there is no replica or failover
  for the database itself.
- **The Docker cluster has not yet been run end to end.** The Redis logic is tested in CI; the
  three-instance setup and nginx are not.
- **Surge pricing** (`calculateSurge`) is implemented but not yet used when pricing rides.
- **Payments are simulated**, the **SOS button** shows an alert only, the **trip-sharing link**
  is a placeholder, and the **in-ride chat** replies with canned, keyword-matched messages.
- Several secondary screens are front-end only: the wallet shows sample data, and referrals,
  expenses and the break scheduler keep their data in the browser.
