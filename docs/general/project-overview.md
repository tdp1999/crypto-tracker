## Notum Backend – Project Overview (Personal Asset Management)

A concise overview of the backend’s purpose, delivered work, upcoming plans, structure, and architecture for a broader personal asset management app.

---

## What this project is about

- **Purpose**: A personal asset management backend. It centralizes multiple life-finance modules under one system:
    - Asset management (accounts, investments, real estate, collectibles, custom assets)
    - Crypto tracker (current: portfolios/holdings/transactions/prices)
    - Monthly expenses (expense tracking, categories, budgets)
    - Subscription management (recurring payments, reminders)
    - Reporting & analytics (net worth, cash flow, performance)
- **Tech Stack**: NestJS 11, TypeScript, TypeORM (PostgreSQL), Zod, CQRS, Hexagonal Architecture.
- **Runtime**:
    - HTTP server (global prefix via `general.globalPrefix`), TCP microservice configured in `src/main.ts`.
    - Global interceptors, filters, and auth guard configured in `src/app.module.ts`.

Key entrypoints:

- `src/main.ts` boots the HTTP app and connects a TCP microservice.
- `src/app.module.ts` wires configs, DB, CQRS, global guards/filters/interceptors, and feature modules.

---

## What we have done

Based on the codebase and docs (`docs/timeline.md`, `src/modules/**`).

- **Core setup**
    - NestJS app skeleton, environment-driven config (`src/core/configs/**`).
    - PostgreSQL via TypeORM with async config and environment-aware logging.
    - Zod global error map and exception handling.

- **Authentication & Users**
    - `AuthModule`: login/register/me with JWT access tokens.
    - `UserModule`: user CRUD.

- **Provider integration**
    - `ProviderModule`: CoinGecko integration via adapter to enhance token metadata.

- **Crypto tracker (current state)**
    - `PortfolioModule`: portfolio CRUD (create/list/detail/update/delete).
    - Domain foundations for holdings and transactions (simplified) and initial services.
    - Persistence and initial migrations for portfolio/holding.

- **Conventions & tooling**
    - CQRS across application layer; repository naming conventions documented.
    - OpenAPI spec present (`docs/specs/openapi.json`).
    - Seeding pipeline available (`pnpm run seed`).

For a detailed timeline and checklists, see `docs/timeline.md`.

---

## What is about to do (near-term roadmap)

Shifting to a multi-module personal asset management app:

- **Asset Management Module**
    - Asset registry (types, categories, tagging), valuation snapshots, attachments/notes.
    - Basic CRUD, listing, and net worth contribution.

- **Monthly Expenses Module**
    - Expense entries, categories, budgets, recurring rules, monthly rollups.
    - Queries for spend by category, budget vs. actual, trends.

- **Subscription Management Module**
    - Subscriptions with billing cycles, next due date, payment method, reminders.
    - Upcoming charges feed and notifications.

- **Crypto Tracker Enhancements**
    - Transactions, swaps, performance queries; price update & snapshot background jobs.

- **Reporting & Analytics**
    - Net worth timeline (aggregates assets + crypto), cash flow (expenses − subscriptions), dashboards.

- **Cross-cutting Services**
    - Scheduling (cron), notification adapters, caching, rate limiting for providers.

Refer to:

- `docs/workspace/todo/price-update-system.md` (price updates & snapshots design).
- `docs/timeline.md` (phase-by-phase progress and next checkpoints).

---

## Project structure

High-level structure follows the rules in `docs/general/folder-structure.md`. New modules extend `src/modules/` alongside existing ones.

```text
src/
├─ core/                 # Cross-cutting capabilities and system-wide building blocks
│  ├─ configs/           # environment, database
│  ├─ errors/ | filters/ | interceptors/ | decorators/ | features/ | ...
├─ modules/
│  ├─ auth/
│  ├─ user/
│  ├─ provider/
│  ├─ portfolio/         # Crypto tracker (existing)
│  ├─ asset/             # General assets (planned)
│  ├─ expenses/          # Monthly expenses (planned)
│  ├─ subscription/      # Subscriptions (planned)
│  └─ reporting/         # Cross-module reports (planned)
├─ shared/               # Reusable utilities, constants, VOs (no import from core)
└─ main.ts               # app bootstrap (HTTP + TCP microservice)
```

Conventions:

- `shared/` can be reused anywhere; `core/` must not import from `shared/`.
- Modules use hexagonal layering: `domain/`, `application/`, `infrastructure/`.

---

## Architecture and design patterns

- **Hexagonal Architecture (Ports & Adapters)**
    - Application defines ports; infrastructure implements adapters (controllers, persistence, external services).
- **CQRS**
    - Commands for writes; queries for reads/aggregation per use case.
- **DDD modularization**
    - Domain entities, value objects, domain services per module under `domain/`.
- **Clean Architecture influences**
    - Inner layers independent of frameworks; infrastructure at the edges.
- **NestJS patterns**
    - Global `APP_GUARD`, `APP_FILTER`, `APP_INTERCEPTOR`; custom decorators under `core/decorators`.
- **Validation & schemas**
    - Zod schemas with global error map; DTOs per use case in application layer.
- **Persistence**
    - TypeORM entities in `infrastructure/persistence/`, async DB config, environment-aware logging.
- **Conventions**
    - Repository naming and method semantics: see `docs/general/repository-naming.md`.

---

## Configuration and environments

- Centralized config via `@nestjs/config` with loaders in `src/core/configs/**`.
- Keys like `general.port`, `general.globalPrefix`, `general.transportHost`, `general.transportPort` are read in `src/main.ts`.
- Plan for `dev`, `uat`, `prod` environments; never commit `.env` files.

---

## APIs and contracts

- REST controllers live under each module’s `infrastructure/controller` (when present).
- OpenAPI contract stored at `docs/specs/openapi.json`.
- RPC/microservice endpoints under `infrastructure/rpc` when needed.

---

## Testing and quality

- Unit/e2e via Jest; coverage under `coverage/`.
- API flows/examples under `test/apidog/docs` and Postman artifacts under `test/postman/`.

---

## Developer workflow

- Install: `pnpm install`
- Run: `pnpm start` (dev: `pnpm start:dev`), build: `pnpm build`
- Test: `pnpm test`, e2e: `pnpm test:e2e`, coverage: `pnpm test:cov`
- DB migrations: `pnpm migrate` / `pnpm run migration:generate` / `pnpm run migration:revert`
- Seed: `pnpm run seed`

---

## Pointers to deeper docs

- Structure rules: `docs/general/folder-structure.md`
- Naming conventions: `docs/general/repository-naming.md`
- Timeline and phase plan: `docs/timeline.md`
- Price update & snapshot system: `docs/workspace/todo/price-update-system.md`
- Patterns reference: `docs/patterns/*.pattern.ts`
