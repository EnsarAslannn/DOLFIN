# 🐬 DOL-FIN API

[![CI](https://github.com/EnsarAslannn/DOLFIN/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/EnsarAslannn/DOLFIN/actions/workflows/backend-ci.yml)

The backend for [DOL-FIN](https://github.com/EnsarAslannn/DOL-FIN), an enterprise-focused financial management platform: an ASP.NET Core Web API handling authentication, portfolio management, and stock/comment data over a relational PostgreSQL schema.

The hosted API has been retired. See the [video demo](../README.en.md#video-demo) for the user flow.
When running the API locally, open `/scalar` for the interactive documentation.

The frontend (React/TypeScript) lives in a separate repo: [DOL-FIN](https://github.com/EnsarAslannn/DOL-FIN).

## Features

- **Authentication:** ASP.NET Core Identity, JWT delivered via an httpOnly cookie (not exposed to JS), role-based authorization (`Admin`/`User`).
- **CSRF Protection:** Double-submit cookie pattern (`IAntiforgery`) on every authenticated, state-changing request.
- **Portfolio Engine:** Buy/sell/deposit/withdraw with transactional consistency (`IUnitOfWork`), portfolio metrics/allocation warnings/rebalancing suggestions, price alerts with a background check, ownership-checked comment CRUD, admin-only stock management.
- **Validation:** Centralized [FluentValidation](https://docs.fluentvalidation.net/) validators for every request DTO, enforced by a single global action filter (`ValidationActionFilter`) instead of ad hoc checks in controllers.
- **Rate Limiting:** IP-partitioned fixed-window limiter on login/register.
- **Caching:** Redis-backed distributed cache (`HybridCache` + StackExchangeRedis) for stock, comment, and portfolio reads, with cache-aside invalidation on writes, per-key hit/miss metrics, and cache warming on startup (see [Caching Strategy](#caching-strategy) below).
- **API Docs:** Interactive OpenAPI docs via [Scalar](https://github.com/scalar/scalar) at `/scalar`, generated live from the controllers' XML doc comments (see [API Documentation](#api-documentation) below) — not a hand-maintained file, so it can't drift from the real routes.
- **Health Checks:** `/health` verifies Postgres (hard dependency) and Redis (soft dependency — reported `Degraded`, not `Unhealthy`, since the app already falls back to direct DB reads if Redis is unreachable). Gates both the Dockerfile's own `HEALTHCHECK` and Railway's deploy healthcheck (`railway.json`).

## Tech Stack

.NET 10.0 & ASP.NET Core Web API, Entity Framework Core & PostgreSQL (Npgsql), Redis (StackExchangeRedis + HybridCache), ASP.NET Core Identity & JWT Bearer auth, Serilog, xUnit + Moq + Testcontainers for testing, Docker.

Deployed on [Railway](https://railway.app) from the multi-stage `Dockerfile` at the repo root (`railway.json` points Railway at it explicitly and configures the `/health` deploy healthcheck); database migrations run automatically on startup. Every push to `main` deploys straight to production — there's no staging environment.

## Setup

Two ways to run this locally: the full stack in Docker (fastest to get
running, no local Postgres/.NET SDK needed beyond Docker itself), or the API
directly via `dotnet run` against containerized Postgres/Redis (better for
active development — faster iteration, debugger attaches directly).

### Option A: Full stack via Docker Compose

```bash
git clone https://github.com/EnsarAslannn/DOL-FIN-api.git
cd DOL-FIN-api
docker compose up -d --build
curl http://localhost:5002/health
```

Builds the same multi-stage `Dockerfile` Railway deploys, runs migrations on
startup, and starts Postgres + Redis alongside it — `docker compose ps` shows
all three as `healthy` once ready. The JWT signing key baked into
`docker-compose.yml` is a dev-only placeholder; never reuse it anywhere real.

```bash
docker compose logs -f api                          # tail API logs
docker compose exec postgres psql -U postgres -d dolfin  # inspect the DB
docker compose down -v                               # stop and wipe volumes
```

### Option B: `dotnet run` against containerized dependencies

#### Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- A local PostgreSQL instance (or a connection string to any reachable one)
- Docker (for a local Redis instance via `docker compose up -d redis`)

#### Steps

```bash
git clone https://github.com/EnsarAslannn/DOL-FIN-api.git
cd DOL-FIN-api
docker compose up -d redis
dotnet restore
```

Set secrets locally via `dotnet user-secrets` — these must never be committed to `appsettings.json`:

```bash
dotnet user-secrets init
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Database=dolfin;Username=postgres;Password=..."
dotnet user-secrets set "JWT:SigningKey" "<a random key at least 64 characters long>"
```

`appsettings.Development.json` already points `ConnectionStrings:Redis` at `localhost:6379`, matching the compose file above — no extra secret needed unless you're running Redis elsewhere.

Apply migrations and run:

```bash
dotnet ef database update
dotnet run
```

The API listens on `https://localhost:7109` by default; interactive docs are at `/scalar`.

To make a locally-registered user an admin, set `Admin:SeedUsername` (via `dotnet user-secrets` or `appsettings.Development.json`) to that user's username and restart — the app grants the `Admin` role to a matching user on startup if they aren't already in it.

## API Documentation

The OpenAPI document is generated live at request time from the controllers'
XML doc comments and `[ProducesResponseType]` attributes — not a
hand-maintained file, so it can't quietly drift from the real routes the way
a manually-exported spec would.

- **Interactive docs (Scalar):** `/scalar` — try requests directly from the browser.
- **Raw OpenAPI document:** `/openapi.json` — paste it into [editor.swagger.io](https://editor.swagger.io) to validate it independently, or point any OpenAPI-aware client generator at it.

```bash
curl http://localhost:5002/openapi.json
```

Every action documents its realistic response codes (200/400/401/403/404/409)
and, where the response has one, its concrete DTO type; validation failures
(400) come back as a standard `ValidationProblemDetails` with a per-field
`errors` object (see the FluentValidation section above).

## Caching Strategy

Cache-aside, via `HybridCache` (an in-process L1 + Redis L2 tier) wrapping
each repository/service behind its existing interface — `StockController`,
`CommentController`, and `PortfolioController` never know caching is
involved. Keys and TTLs are centralized in `Caching/CacheKeys.cs` and
`Caching/CacheConfiguration.cs`, the single source of truth for both.

| Data | Cached? | TTL | Invalidated on |
|---|---|---|---|
| Stock list (`GET /api/stock`) | ✅ | 60s | Any stock create/update/delete (tag-based, clears every filter/sort/page variant at once) |
| Stock by id/symbol | ✅ | 5m | That stock's own create/update/delete |
| Market trends (`GET /api/stock/trends`) | ✅ | 10m | Any stock create/update/delete; also warmed once on startup (`CacheWarmingService`) — the one endpoint with a single canonical key that's worth pre-populating |
| Comment list (`GET /api/comment`) | ✅ | 60s | Any comment create/update/delete (tag-based) |
| Comment by id (`GET /api/comment/{id}`) | ✅ | 5m | That comment's own update/delete |
| User's portfolio positions (`GET /api/portfolio`) | ✅ | 5m | Buy/sell/deposit/withdraw for that user |
| Portfolio metrics/warnings/rebalance | ❌ | — | Computed in-memory from the (already-cached) position list above — a position list rarely exceeds a few dozen rows, so a second cache layer on top would save a LINQ pass, not a DB round trip |
| Price alerts/notifications | ❌ | — | Small, per-user lists with low read volume; caching them would add invalidation complexity for negligible benefit |

**Stampede protection:** `HybridCache.GetOrCreateAsync` already coalesces
concurrent callers for the same key within one process — only the first
caller's factory runs; the rest await its result. There's no separate
distributed-lock layer on top of that: this app runs as a single Railway
instance, so a hand-rolled Redis `SETNX` lock would duplicate protection the
library already provides, for a cross-process race that isn't in play here.

**Resilience:** every cache read/write is wrapped in try/catch that falls
back to a direct DB read/no-op on a Redis failure (see the `SafeRemoveAsync`/
catch blocks in `CachedStockRepository`, `CachedCommentRepository`, and
`PortfolioService`) — a Redis outage degrades response times, it doesn't
break the app (see the `/health` endpoint reporting Redis as `Degraded`
rather than `Unhealthy` for the same reason).

**Monitoring:** `ICacheMetrics` (a DI singleton, not static state) records a
hit/miss per cache key, exposed read-only via `GET /api/diagnostics/cache-metrics`
(Admin only). `GET /api/diagnostics/redis-info` reports live Redis server
stats (memory, connected clients, ops/sec, key count) via a dedicated
`IConnectionMultiplexer` registered only when a Redis connection string is
configured — both counters are in-memory/live, not persisted, and reset on
every restart.

## Tests

```bash
dotnet test api.sln
```

Two projects: `api.Tests` (unit tests — repositories against EF Core
InMemory, services and validators via Moq) and `api.IntegrationTests`
(endpoint tests against a real Postgres + Redis via Testcontainers —
requires Docker running locally). Both run in CI on every push; see
`.github/workflows/ci.yml`.

## Project Structure

```
Controllers/           API endpoints (Account, Stock, Portfolio, Comment, PriceAlert)
Service/               Business logic (PortfolioService, PortfolioAnalyticsService,
                       RebalancingService, PriceAlertService + its background job, TokenService)
Repository/            Data access behind interfaces
Validation/            FluentValidation validators + the global ValidationActionFilter
Dtos/                  Request/response contracts
Models/                EF Core entities
Migrations/            EF Core migrations
api.Tests/              xUnit unit test project
api.IntegrationTests/   xUnit integration test project (Testcontainers)
```

## License

[MIT](./LICENSE)

## Contact

**Ensar Aslan** — [GitHub](https://github.com/EnsarAslannn)
