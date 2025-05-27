# Crypto Tracker - Progress Tracker

**Generated**: 30 May 2025  
**Based on**: `docs/timeline.md` and `docs/wf/transaction-plan.md`  
**Current Phase**: Phase 2 (Asset Management) - Portfolio Management Complete  
**Overall Progress**: ~50% Complete

---

## Phase 1: Core Setup & Authentication ✅ **COMPLETED**

### Project Setup

- [x] Set up NestJS project structure

    - **Files**: `src/app.module.ts`, `src/main.ts`, `nest-cli.json`, `tsconfig.json`
    - **Notes**: Project uses proper NestJS structure with CQRS, TypeORM, and Clean Architecture

- [x] Configure PostgreSQL database
    - **Files**: `src/core/configs/postgres-database.config.ts`, `src/core/configs/data-source.config.ts`
    - **Notes**: TypeORM configuration with environment-based setup

### Authentication & JWT

- [x] Implement JWT authentication (access tokens)

    - **Files**: `src/modules/auth/auth.module.ts`, `src/modules/auth/infrastructure/jwt.adapter.ts`
    - **Status**: Basic JWT implemented

- [ ] Implement refresh tokens
    - **Missing**: `POST /auth/refresh` endpoint
    - **Priority**: Medium

### User Management Endpoints

- [x] `POST /auth/register` - Register a new user

    - **File**: `src/modules/auth/application/commands/register.command.ts`

- [x] `POST /auth/login` - Authenticate user and return tokens

    - **File**: `src/modules/auth/application/commands/login.command.ts`

- [x] `GET /auth/me` - Get authenticated user profile

    - **File**: `src/modules/auth/infrastructure/auth.controller.ts`

- [ ] `PUT /users/me` - Update user profile
    - **Status**: User CRUD exists but endpoint needs verification

### User Profile Management

- [x] Implement user profile management

    - **Files**: `src/modules/user/user.module.ts`, `src/modules/user/infrastructure/user.controller.ts`
    - **Features**: Full CRUD operations implemented

- [x] Define database schema for users

    - **Files**: `src/modules/user/infrastructure/user.persistence.ts`
    - **Notes**: User entity with proper TypeORM decorators

- [ ] Add user-profile entity
    - **Status**: Not implemented
    - **Required**: Enhanced user profile entity with additional profile fields

### Modules

- [x] **AuthModule** - `src/modules/auth/auth.module.ts`
- [x] **UsersModule** - `src/modules/user/user.module.ts`

---

## Phase 2: Asset Management (Token Tracking & Portfolios) 🔄 **IN PROGRESS**

### External API Integration

- [x] Integrate external APIs for token data retrieval

    - **Files**: `src/modules/provider/provider.module.ts`, `src/modules/provider/infrastructure/coingecko/`
    - **Notes**: CoinGecko API integration with adapter pattern

- [x] Implement token search functionality
    - **Files**: `src/modules/provider/infrastructure/provider.controller.ts`
    - **Endpoint**: Search via external API (CoinGecko)

### Database Schema & Core Entities

- [x] Create database schema for portfolios

    - **Files**: `src/modules/portfolio/infrastructure/portfolio.persistence.ts`, `src/modules/portfolio/infrastructure/migrations/1748319795904-CreatePortfolioTable.ts`
    - **Notes**: Each user can have multiple portfolios (e.g., "Main Portfolio", "Trading Portfolio")

- [ ] Create database schema for tokens

    - **Missing**: Token entity/persistence layer
    - **Required**: `src/modules/asset/persistence/token.persistence.ts`
    - **Notes**: Store master token information (symbol, name, refId, decimals, is_stablecoin)

- [ ] Create database schema for portfolio holdings

    - **Missing**: Portfolio holdings entity/persistence layer
    - **Required**: `src/modules/asset/persistence/portfolio-holding.persistence.ts`
    - **Notes**: Current state of tokens held in each portfolio (quantity, cost basis, avg price)

- [ ] Create database schema for current token prices

    - **Missing**: Token price cache entity/persistence layer
    - **Required**: `src/modules/asset/persistence/token-price.persistence.ts`
    - **Notes**: Hot cache for current token prices (price_usd, market_cap, volume_24h, price_change_24h)

- [ ] Cache frequently accessed token data
    - **Status**: No caching mechanism implemented yet
    - **Notes**: Consider Redis or in-memory caching for hot token data

### Portfolio Management

- [x] `POST /portfolios` - Create a new portfolio

    - **Files**: `src/modules/portfolio/infrastructure/portfolio.controller.ts`, `src/modules/portfolio/application/commands/create-portfolio.command.ts`

- [x] `GET /portfolios` - Get user's portfolios

    - **Files**: `src/modules/portfolio/infrastructure/portfolio.controller.ts`, `src/modules/portfolio/application/queries/list-portfolios.query.ts`

- [x] `GET /portfolios/:id` - Get specific portfolio details

    - **Files**: `src/modules/portfolio/infrastructure/portfolio.controller.ts`, `src/modules/portfolio/application/queries/get-portfolio.query.ts`

- [x] `PUT /portfolios/:id` - Update portfolio details

    - **Files**: `src/modules/portfolio/infrastructure/portfolio.controller.ts`, `src/modules/portfolio/application/commands/update-portfolio.command.ts`

- [x] `DELETE /portfolios/:id` - Delete a portfolio
    - **Files**: `src/modules/portfolio/infrastructure/portfolio.controller.ts`, `src/modules/portfolio/application/commands/delete-portfolio.command.ts`

### Token Holdings Management (within Portfolios)

- [ ] `POST /portfolios/:portfolioId/holdings` - Add/update portfolio token holding

    - **Status**: Not implemented
    - **Notes**: Create or update token holding when user manually adds tokens

- [ ] `GET /portfolios/:portfolioId/holdings` - Get portfolio token holdings

    - **Status**: Not implemented
    - **Notes**: Return current token holdings with quantities, cost basis, current values

- [ ] `PUT /portfolios/:portfolioId/holdings/:tokenId` - Update portfolio token holding

    - **Status**: Not implemented
    - **Notes**: Update quantity, cost basis for manual portfolio management

- [ ] `DELETE /portfolios/:portfolioId/holdings/:tokenId` - Remove token holding from portfolio
    - **Status**: Not implemented

### Token Management

- [x] `GET /tokens/search` - Search for tokens via external API

    - **Status**: ✅ **COMPLETED** via ProviderModule
    - **Files**: `src/modules/provider/infrastructure/provider.controller.ts`
    - **Notes**: Direct usage of ProviderModule for external API token search

- [ ] `POST /tokens` - Add token to local database

    - **Status**: Not implemented
    - **Notes**: Store frequently used tokens locally for better performance

- [x] `GET /tokens/:id/price` - Get current token price

    - **Status**: ✅ **COMPLETED** via ProviderModule
    - **Files**: `src/modules/provider/infrastructure/provider.controller.ts`
    - **Notes**: Direct usage of ProviderModule for fetching current token prices

### Modules

- [x] **PortfolioModule** - `src/modules/portfolio/portfolio.module.ts`
- [ ] **AssetModule** - Unified module for assets (`src/modules/asset/`)
- [x] **ExternalApiModule** - Implemented as ProviderModule

---

## Phase 3: Transaction Management (Portfolio-based) ❌ **NOT STARTED**

### Database Schema

- [ ] Define database schema for transactions

    - **Missing**: Transaction entity/persistence layer
    - **Required**: Single-direction transaction records with portfolio_id, token_id, amount (+/-), price_per_token, transaction_type, cash_flow
    - **Notes**: Each transaction is a single direction (add/remove tokens), supports TRADE, DEPOSIT, WITHDRAWAL, TRANSFER_IN, TRANSFER_OUT

- [ ] Define database schema for token swaps

    - **Missing**: Token swap entity linking two transactions
    - **Required**: Links sell and buy transactions for token-to-token swaps
    - **Notes**: Enables tracking USDT → BTC type swaps with proper rates

- [ ] Define database schema for cash flows
    - **Missing**: Cash flow tracking for stablecoin movements
    - **Required**: Track actual money in/out for true P&L calculation
    - **Notes**: Links to transactions, tracks USD equivalent values

### Portfolio-based CRUD Operations

- [ ] `POST /portfolios/:portfolioId/transactions` - Create a new transaction in portfolio
- [ ] `GET /portfolios/:portfolioId/transactions` - Get all transactions for a portfolio
- [ ] `GET /portfolios/:portfolioId/transactions/:id` - Get specific transaction by ID
- [ ] `PUT /portfolios/:portfolioId/transactions/:id` - Update a transaction
- [ ] `DELETE /portfolios/:portfolioId/transactions/:id` - Delete a transaction

### Token Swap Operations

- [ ] `POST /portfolios/:portfolioId/transactions/swap` - Create token swap (USDT → BTC)
- [ ] `GET /portfolios/:portfolioId/swaps` - Get swap history for portfolio
- [ ] Transaction automatic holdings update logic

### Cross-Portfolio Operations

- [ ] `GET /transactions` - Get all user transactions across portfolios
- [ ] `GET /transactions/search` - Search transactions across all portfolios with filters

### Business Logic

- [ ] Implement automatic portfolio holdings updates on transaction
- [ ] Implement FIFO cost basis calculation for holdings
- [ ] Develop transaction filtering and history retrieval per portfolio
- [ ] Ensure data validation and business rules (valid buy/sell actions)
- [ ] Store transaction details:
    - [ ] Portfolio ID (required)
    - [ ] Token ID (from token management)
    - [ ] Amount (positive = add, negative = remove)
    - [ ] Price per token
    - [ ] Transaction type (TRADE, DEPOSIT, WITHDRAWAL, etc.)
    - [ ] Cash flow impact
    - [ ] Fees (optional)
    - [ ] External transaction ID (for linking swaps)
    - [ ] Source (exchange, wallet, etc.)
    - [ ] Notes (optional)

### Modules

- [ ] **TransactionsModule** - Not created

---

## Phase 4: Portfolio Tracking & Reporting (Snapshot-based) ❌ **NOT STARTED**

### Snapshot Strategy Database Schema

- [ ] Define database schema for portfolio snapshots

    - **Missing**: Portfolio snapshot entity for historical tracking
    - **Required**: Daily/transaction/manual snapshots with total_value, total_cost_basis, total_pnl, pnl_percentage
    - **Notes**: Enables historical performance tracking without storing full price history

- [ ] Define database schema for snapshot cleanup
    - **Required**: Data retention policies and cleanup jobs
    - **Notes**: Keep transaction snapshots forever, daily for 1 year, weekly for 2 years, monthly forever

### Real-time Portfolio Performance

- [ ] Implement current portfolio performance calculation
- [ ] Calculate real-time portfolio value using current token prices
- [ ] Calculate portfolio-specific metrics:
    - [ ] Portfolio total value (current)
    - [ ] Portfolio total cost basis
    - [ ] Portfolio unrealized P&L
    - [ ] Portfolio ROI percentage
    - [ ] Holdings breakdown with current values

### Snapshot-based Historical Tracking

- [ ] Implement automated daily snapshots (background job)
- [ ] Implement transaction-triggered snapshots
- [ ] Implement manual snapshot creation
- [ ] Calculate historical performance using snapshots
- [ ] Support different time periods (7d, 30d, 90d, 1y)

### True P&L Calculation with Cash Flow

- [ ] Implement cash flow analysis for true P&L calculation
- [ ] Calculate net cash invested vs current portfolio value
- [ ] Distinguish between holding-based P&L vs cash flow-based P&L
- [ ] Track stablecoin flows for accurate money in/out tracking

### Portfolio Reporting Endpoints

- [ ] `GET /portfolios/:portfolioId/performance` - Get current + historical performance
- [ ] `GET /portfolios/:portfolioId/snapshots` - Get portfolio snapshots with filters
- [ ] `POST /portfolios/:portfolioId/snapshots` - Create manual snapshot
- [ ] `GET /portfolios/:portfolioId/pnl-analysis` - Get enhanced P&L with cash flow analysis
- [ ] `GET /reports/consolidated` - Get consolidated report across all portfolios
- [ ] `GET /reports/comparison` - Compare performance between portfolios

### Background Jobs & Automation

- [ ] Implement daily snapshot creation (cron job)
- [ ] Implement weekly/monthly snapshot aggregation
- [ ] Implement snapshot cleanup jobs
- [ ] Add monitoring and alerting for snapshot failures

### Cross-Portfolio Analytics

- [ ] Generate consolidated reports across all user portfolios
- [ ] Portfolio performance comparison using snapshots
- [ ] Asset allocation across portfolios
- [ ] Overall user investment summary with true P&L

### Database Optimization for Snapshots

- [ ] Add indexes for snapshot queries (portfolio_id, snapshot_date, type)
- [ ] Optimize snapshot creation performance
- [ ] Implement efficient chart data queries

### Modules

- [ ] **ReportsModule** - Not created

---

## Phase 5: Performance & Security Enhancements ❌ **NOT STARTED**

### Caching

- [ ] Add caching mechanisms (Redis) for token prices and reports
- [ ] Cache frequently accessed token data
- [ ] Implement cache invalidation strategies

### Security

- [ ] Implement role-based access control (RBAC) for future multi-user support
- [ ] Set up API rate limiting to prevent excessive external API calls
- [ ] Add input validation and sanitization
- [ ] Implement request throttling

### Performance

- [ ] Optimize database indexes for faster queries on transactions and tokens
- [ ] Add database indexes for:
    - [ ] User transactions
    - [ ] Token queries
    - [ ] Watchlist lookups
- [ ] Query optimization for reports

### Module Optimizations

- [ ] **ExternalApiModule** optimization
- [ ] **ReportsModule** optimization
- [ ] **AuthModule** optimization

---

## Phase 6: Final Testing & Deployment ❌ **NOT STARTED**

### Testing

- [ ] Conduct unit tests
    - **Current**: Test structure exists (`test/`) but minimal implementation
- [ ] Conduct integration tests
- [ ] Add API endpoint testing
- [ ] Add database testing
- [ ] Add external API mocking for tests

### Background Jobs

- [ ] Set up background jobs for periodic token price updates
- [ ] Implement cron jobs for price synchronization
- [ ] Implement daily portfolio snapshot creation
- [ ] Implement snapshot cleanup jobs (data retention)
- [ ] Add job scheduling and monitoring

### Documentation

- [ ] Prepare documentation for API endpoints
    - **Current**: Partial documentation exists (`docs/specs/openapi.json`, `test/postman/`)
- [ ] Complete OpenAPI/Swagger documentation
- [ ] Add code documentation
- [ ] Create deployment guide

### Deployment

- [ ] Deploy backend services
- [ ] Set up production environment
- [ ] Configure production database
- [ ] Set up monitoring and logging
- [ ] Configure CI/CD pipeline

---

## Priority Action Items

### 🚨 High Priority (Complete Phase 2)

- [x] **Create Portfolio Management Module** ✅ **COMPLETED**

    - [x] Create proper `src/modules/portfolio/` structure
    - [x] Implement Portfolio entity and repository
    - [x] Create portfolio CRUD endpoints
    - [x] Implement CQRS pattern with commands and queries
    - [x] Add database migration for portfolios table

- [ ] **Create Asset Management Module** (NEXT PRIORITY)
    - [ ] Create proper `src/modules/asset/` structure
    - [ ] Implement Token entity and repository (master token data)
    - [ ] Implement Portfolio Holdings entity and repository (current token positions)
    - [ ] Implement Token Price entity and repository (hot price cache)
    - [ ] Create token management endpoints (via ProviderModule for search/price)
    - [ ] Create portfolio token holdings management endpoints
    - [ ] Add database migrations for all asset tables

### 🔸 Medium Priority

- [ ] **Add Token Caching**

    - [ ] Implement Redis or in-memory caching for token prices
    - [ ] Cache frequently accessed token data

- [ ] **Complete Authentication**
    - [ ] Add refresh token support
    - [ ] Implement `POST /auth/refresh` endpoint

### 🔹 Low Priority (Phase 3+)

- [ ] **Portfolio-based Transaction Management Module**
    - [ ] Create `src/modules/transaction/` module
    - [ ] Implement portfolio-scoped transaction CRUD operations
    - [ ] Add validation and business rules for portfolio transactions

---

## Technical Implementation Notes

### ✅ Architecture Strengths

- Clean Architecture with DDD patterns
- CQRS implementation
- Good separation of concerns
- TypeScript with strong typing
- External API integration with adapter pattern

### ⚠️ Areas for Improvement

- Missing core business logic modules (Asset Management, Transaction, Snapshot-based Reports)
- No caching strategy implemented for token prices
- Limited test coverage
- Missing refresh token functionality
- No background jobs for price updates and snapshots
- No rate limiting or advanced security features
- No true P&L calculation with cash flow tracking

### 📁 Key File Locations

- **Completed**: `src/modules/auth/`, `src/modules/user/`, `src/modules/provider/`, `src/modules/portfolio/`, `src/core/configs/`
- **Empty/Missing**: `src/modules/asset/` (tokens, holdings, prices, watchlist), `src/modules/transaction/`, `src/modules/reports/`

### 🏗️ Portfolio Architecture Notes

- **Portfolio-First Design**: All holdings, watchlists, and transactions belong to specific portfolios
- **Multi-Portfolio Support**: Users can have multiple portfolios (e.g., "Main", "Trading", "DCA")
- **Asset Management Module**: Tokens, portfolio holdings, price cache, and watchlists unified under AssetModule
- **Snapshot-based Reporting**: Historical performance tracking without full price history storage
- **True P&L Tracking**: Cash flow analysis for accurate profit/loss calculation
- **Single-Direction Transactions**: Simplified transaction model with automatic holdings updates

---

**Last Updated**: 30 May 2025  
**Next Review**: Complete Asset Management module (Phase 2)
