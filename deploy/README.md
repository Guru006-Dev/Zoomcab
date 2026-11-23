# Running Zoomcab as a cluster

`docker compose` starts Redis, three backend instances (`api-1`, `api-2`, `api-3`) sharing one
SQLite database, and nginx, which serves the frontend and load-balances `/api` and `/socket.io`
across the instances.

> Status: written but not yet run. Expect to fix small things the first time.

## Start

```bash
# from the repo root
export JWT_SECRET=$(openssl rand -hex 32)   # PowerShell: $env:JWT_SECRET = -join ((1..64) | % { '{0:x}' -f (Get-Random -Max 16) })
docker compose up --build
```

Open http://localhost:8080. Demo users: `Guru / 123456` (rider), `Driver1 / password` (driver).
Set `DEMO_MODE=false` to turn off the simulated auto-accepting driver.

## What to check

1. **Load balancing.** Call the health endpoint a few times; `instanceId` and the
   `X-Served-By` header should rotate between `api-1`, `api-2` and `api-3`:
   ```bash
   curl -si http://localhost:8080/api/health | grep -iE "x-served-by|instanceId"
   ```
2. **Cross-instance events.** Log in as a rider in one browser and a driver in another (private
   window). They will usually be connected to different instances. Requesting a ride should still
   reach the driver, and accepting should still reach the rider — that is the Redis adapter.
3. **Accept race.** Two drivers accepting the same ride at once: exactly one gets `200`, the
   other `409`.
4. **Leader failover.** Find the leader, kill it, and watch another instance take over within
   about 15 seconds (the leader heartbeat TTL):
   ```bash
   curl -s http://localhost:8080/api/health        # note "leader"
   docker compose stop api-3                        # the highest id wins, so usually api-3
   sleep 20; curl -s http://localhost:8080/api/health
   docker compose start api-3                       # it rejoins; the current leader keeps the role until it dies
   ```
5. **Redis outage.** `docker compose stop redis`: the app keeps working on SQLite-only matching
   (health shows `"redis":"unavailable"`), cross-instance socket events stop until Redis returns.

## How the pieces fit

| Concern | Mechanism |
|---|---|
| Nearest driver | Redis `GEORADIUS` over `DriverLocations`; SQLite Haversine scan if Redis is down |
| No double-booking a driver | Lua script reserves the driver in Redis, conditional `UPDATE ... WHERE status='available'` in SQLite |
| One winner per ride | Conditional `UPDATE rides ... WHERE status='pending'` (atomic in SQLite) |
| Events reach the right user on any instance | Per-user Socket.IO rooms + `@socket.io/redis-adapter` |
| Background coordination | Bully-style leader election with heartbeat TTL in Redis |
| Instance discovery | Service registry keys with TTL heartbeats in Redis |

## Known limits

- All instances share one SQLite file on a Docker volume. It works on one host (WAL + busy
  timeout), but it is the weak point; Postgres is the planned replacement.
- Sockets are WebSocket-only so nginx needs no sticky sessions. Clients that can't use
  WebSocket will not connect.
