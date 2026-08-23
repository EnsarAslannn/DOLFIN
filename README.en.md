# 🐬 DOL-FIN

[🇹🇷 Türkçe](README.md) | [🇬🇧 English](README.en.md)

[![Frontend CI](https://github.com/EnsarAslannn/DOLFIN/actions/workflows/frontend-ci.yml/badge.svg)](https://github.com/EnsarAslannn/DOLFIN/actions/workflows/frontend-ci.yml)
[![Backend CI](https://github.com/EnsarAslannn/DOLFIN/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/EnsarAslannn/DOLFIN/actions/workflows/backend-ci.yml)

An enterprise-focused financial management platform built on a .NET Web API and React
(TypeScript) architecture, letting users simulate stock trading with a virtual wallet,
track their portfolio, and leave comments on stock pages.

**🔗 Live demo:** [dol-fin.com](https://dol-fin.com) — sign up and try out simulated stock
trading and commenting with your own virtual wallet.

**📄 Live API Docs (Scalar):** [api-production-a1b64.up.railway.app/scalar](https://api-production-a1b64.up.railway.app/scalar)

## 📌 About the Project

DOL-FIN merges code that used to live in two separate repositories (frontend and
backend) into a single monorepo, with both commit histories preserved. It's a financial
management platform where users can buy and sell stocks with a virtual wallet, track
their portfolio allocation and performance, and leave comments on individual stock pages.

The app runs on a hand-crafted local financial data set for TSLA, NVDA, AAPL, GOOGL, and
MSFT, with no dependency on an external market data API.

The goal isn't just a simple buy/sell screen, but a full-stack application that brings
together role-based authorization, CSRF-protected authentication, a Redis-backed caching
layer, and a real CI/CD pipeline running across a monorepo.

## ⚙️ Key Features

### 💼 Portfolio & Asset Management

- Per-user virtual wallet and asset tracking system
- Cash balance, total asset value, and position-level allocation in a single view
- Instant simulated deposit and sell actions
- Unrealized profit/loss against cost basis, both portfolio-wide and per position
- A simulation service that moves prices on an interval, which is what makes P/L and price alerts meaningful
- Paged transaction history covering buys, sells, deposits and withdrawals

### 🔍 Stock Search & Profile

- Hand-crafted local financial data set for TSLA, NVDA, AAPL, GOOGL, and MSFT
- Stock search and detailed profile view
- Admin-only stock management

### 💬 Relational Comment System

- Dynamic comment architecture directly linked to stock tickers
- Ownership-checked comment CRUD (users can only edit/delete their own comments)

### 🔐 Secure Authentication & Authorization

- ASP.NET Core Identity backing JWT delivered via an httpOnly cookie (not exposed to JS)
- Role-based authorization (Admin/User)
- CSRF protection via the double-submit cookie pattern on every state-changing request
- IP-partitioned rate limiting on the login/register endpoints

### ⚡ Caching & Performance

- Redis-backed `HybridCache` (in-process L1 + Redis L2) caching stock, comment, and
  portfolio reads
- Cache-aside invalidation on writes
- Cache warming on startup and per-key hit/miss metrics
- Graceful degradation to direct database reads if Redis is unavailable (fail-open
  approach)

### 🩺 Operational Endpoints

- `/health` — liveness checks for PostgreSQL (hard dependency) and Redis (soft dependency)
- `/scalar` — interactive API documentation generated live from the controllers' XML doc
  comments
- `/api/diagnostics/cache-metrics` and `/api/diagnostics/redis-info` — admin-only
  cache/Redis monitoring endpoints

## 🏗️ Project Architecture

The project merges frontend and backend code that used to live in two separate
repositories into a single monorepo, with both commit histories preserved:

```
frontend/ → React + TypeScript + Vite client
backend/  → ASP.NET Core 10 Web API + PostgreSQL
```

The backend itself follows a layered structure:

```
Controllers/ → API endpoints (Account, Stock, Portfolio, Comment, PriceAlert)
Service/     → Business logic (PortfolioService, RebalancingService, PriceAlertService, TokenService...)
Repository/  → Data access behind interfaces
Validation/  → FluentValidation validators + the global ValidationActionFilter
Dtos/        → Request/response contracts
Models/      → EF Core entities
Migrations/  → EF Core migrations
```

Both subfolders keep their own independent project files (`package.json`, `api.csproj`,
their own `.gitignore`s, `.env.example`s, etc.) — the merge only changed the directory
layout; build/test commands keep working as described above. See
[backend/README.md](./backend/README.md) for backend details and
[ARCHITECTURE.md](./ARCHITECTURE.md) for the architecture breakdown.

## 🛠️ Technology Stack

**Backend**

- .NET 10, ASP.NET Core Web API
- PostgreSQL (Entity Framework Core / Npgsql)
- Redis (StackExchangeRedis + HybridCache)
- ASP.NET Core Identity, JWT (httpOnly cookie)
- FluentValidation, Serilog, Scalar

**Frontend**

- React 19 + TypeScript
- Vite
- Tailwind CSS
- Axios

**Testing**

- xUnit, Moq, Testcontainers (backend)
- Vitest, React Testing Library, Playwright (frontend)

**CI/CD**

- GitHub Actions — `frontend-ci.yml` and `backend-ci.yml`, each triggered only when its
  own folder changes (via a `paths:` filter)
- Backend: multi-stage Docker image deployed on Railway, with `/health` used as the
  deploy healthcheck

## 🚀 Getting Started

### Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js](https://nodejs.org/) 22+
- Docker (for Postgres and Redis services)

### Backend

```bash
cd backend
docker compose up -d redis

dotnet user-secrets init --project api.csproj
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Database=dolfin;Username=postgres;Password=..." --project api.csproj
dotnet user-secrets set "JWT:SigningKey" "<a random key at least 64 characters long>" --project api.csproj

dotnet restore
dotnet ef database update --project api.csproj
dotnet run --project api.csproj # https://localhost:7109 — interactive docs at /scalar
```

> Alternatively, run `docker compose up -d --build` to bring up the API + Postgres +
> Redis in a single command.

### Frontend

```bash
cd frontend
npm install
```

Create a `.env` file pointing at the API:

```env
VITE_API_URL=https://localhost:7109
```

```bash
npm run dev
```

### Running Tests

```bash
# Backend
dotnet test api.sln

# Frontend
npm run lint
npm test        # unit tests (Vitest)
npm run build
npm run test:e2e # end-to-end tests (Playwright) -- requires a build first
```

> Docker must be running for the backend integration tests.

## 📸 Screenshots

**Home Page**

<p align="center">
<img src="frontend/docs/screenshots/homePage.png" width="800"/>
<img src="frontend/docs/screenshots/homePage2.png" width="800"/>
</p>

**Search & Portfolio**

<p align="center">
<img src="frontend/docs/screenshots/searchPage.png" width="800"/>
</p>

**Company Profile**

<p align="center">
<img src="frontend/docs/screenshots/companyProfile.png" width="800"/>
</p>

**Wallet**

<p align="center">
<img src="frontend/docs/screenshots/walletPage.png" width="800"/>
</p>

## 📄 License

MIT — see [LICENSE](./LICENSE).
