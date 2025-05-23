# Crypto Tracker - Progress Tracker

**Generated**: 23 May 2025  
**Based on**: `docs/timeline.md`  
**Current Phase**: Phase 2 (Token Management) - Partially Complete  
**Overall Progress**: ~45% Complete

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

- [ ] Create database schema for portfolios

    - **Missing**: Portfolio entity/persistence layer
    - **Required**: `src/modules/asset/infrastructure/portfolio.persistence.ts`
    - **Notes**: Each user can have multiple portfolios (e.g., "Main Portfolio", "Trading Portfolio")

- [ ] Create database schema for assets (tokens)

    - **Missing**: Asset entity/persistence layer
    - **Required**: `src/modules/asset/infrastructure/asset.persistence.ts`
    - **Notes**: Store token information and link to portfolios

- [ ] Create database schema for watchlists

    - **Missing**: Watchlist entity/persistence layer
    - **Required**: `src/modules/asset/infrastructure/watchlist.persistence.ts`
    - **Notes**: Assets in watchlist belong to specific portfolios

- [ ] Cache frequently accessed token data
    - **Status**: No caching mechanism implemented yet
    - **Notes**: Consider Redis or in-memory caching

### Portfolio Management

- [ ] `POST /portfolios` - Create a new portfolio

    - **Status**: Not implemented

- [ ] `GET /portfolios` - Get user's portfolios

    - **Status**: Not implemented

- [ ] `GET /portfolios/:id` - Get specific portfolio details

    - **Status**: Not implemented

- [ ] `PUT /portfolios/:id` - Update portfolio details

    - **Status**: Not implemented

- [ ] `DELETE /portfolios/:id` - Delete a portfolio
    - **Status**: Not implemented

### Asset Management (within Portfolios)

- [ ] `GET /portfolios/:portfolioId/assets/search?query=btc` - Search tokens for portfolio

    - **Status**: Available via provider module, needs portfolio-specific endpoint

- [ ] `POST /portfolios/:portfolioId/assets` - Add asset to portfolio

    - **Status**: Not implemented

- [ ] `GET /portfolios/:portfolioId/assets` - Get portfolio assets

    - **Status**: Not implemented

- [ ] `DELETE /portfolios/:portfolioId/assets/:assetId` - Remove asset from portfolio
    - **Status**: Not implemented

### Watchlist Management (Portfolio-scoped)

- [ ] `POST /portfolios/:portfolioId/watchlist` - Add token to portfolio watchlist

    - **Status**: Not implemented

- [ ] `DELETE /portfolios/:portfolioId/watchlist/:id` - Remove token from portfolio watchlist

    - **Status**: Not implemented

- [ ] `GET /portfolios/:portfolioId/watchlist` - Get portfolio's watchlist
    - **Status**: Not implemented

### Modules

- [ ] **AssetModule** - Unified module for portfolios, assets, and watchlists (`src/modules/asset/`)
- [x] **ExternalApiModule** - Implemented as ProviderModule

---

## Phase 3: Transaction Management (Portfolio-based) ❌ **NOT STARTED**

### Database Schema

- [ ] Define database schema for transactions
    - **Missing**: Transaction entity/persistence layer
    - **Required**: Transaction table with user_id, portfolio_id, asset_id, type, amount, price_per_unit, timestamp
    - **Notes**: Each transaction belongs to a specific portfolio

### Portfolio-based CRUD Operations

- [ ] `POST /portfolios/:portfolioId/transactions` - Create a new transaction in portfolio
- [ ] `GET /portfolios/:portfolioId/transactions` - Get all transactions for a portfolio
- [ ] `GET /portfolios/:portfolioId/transactions/:id` - Get specific transaction by ID
- [ ] `PUT /portfolios/:portfolioId/transactions/:id` - Update a transaction
- [ ] `DELETE /portfolios/:portfolioId/transactions/:id` - Delete a transaction

### Cross-Portfolio Operations

- [ ] `GET /transactions` - Get all user transactions across portfolios
- [ ] `GET /transactions/search` - Search transactions across all portfolios with filters

### Business Logic

- [ ] Develop transaction filtering and history retrieval per portfolio
- [ ] Ensure data validation and business rules (valid buy/sell actions)
- [ ] Store transaction details:
    - [ ] Portfolio ID (required)
    - [ ] Asset ID (from asset management)
    - [ ] Buy/Sell action
    - [ ] Amount
    - [ ] Price per unit
    - [ ] Timestamp
    - [ ] Fees (optional)
    - [ ] Source (exchange, wallet, etc.)
    - [ ] Notes (optional)

### Modules

- [ ] **TransactionsModule** - Not created

---

## Phase 4: Portfolio Tracking & Reporting ❌ **NOT STARTED**

### Portfolio-based Profit & Loss Calculation

- [ ] Implement profit & loss (P&L) calculation logic using FIFO per portfolio
- [ ] Calculate current position of each asset based on portfolio transactions
- [ ] Support multiple currencies for conversion (USD, VND, etc.)
- [ ] Calculate portfolio-specific metrics:
    - [ ] Portfolio total value
    - [ ] Portfolio total invested
    - [ ] Portfolio unrealized P&L
    - [ ] Portfolio realized P&L
    - [ ] Portfolio ROI percentage

### Portfolio Summary & Reports

- [ ] Generate real-time portfolio-specific reports with:
    - [ ] Current portfolio value
    - [ ] Total invested amount per portfolio
    - [ ] Unrealized P&L per asset in portfolio
    - [ ] Realized P&L from sold assets in portfolio
    - [ ] ROI (%) over different periods per portfolio
    - [ ] Asset allocation breakdown per portfolio

### Portfolio Reporting Endpoints

- [ ] `GET /portfolios/:portfolioId/reports/profit-loss` - Get P&L report for specific portfolio
- [ ] `GET /portfolios/:portfolioId/reports/summary` - Get portfolio summary
- [ ] `GET /portfolios/:portfolioId/reports/performance` - Get portfolio performance metrics
- [ ] `GET /reports/consolidated` - Get consolidated report across all portfolios
- [ ] `GET /reports/comparison` - Compare performance between portfolios

### Cross-Portfolio Analytics

- [ ] Generate consolidated reports across all user portfolios
- [ ] Portfolio performance comparison
- [ ] Asset allocation across portfolios
- [ ] Overall user investment summary

### Database Optimization

- [ ] Optimize database queries for report generation
- [ ] Consider materialized views or precomputed tables for optimization

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

- [ ] **Create Portfolio & Asset Management Module**
    - [ ] Create proper `src/modules/asset/` structure with portfolio support
    - [ ] Implement Portfolio entity and repository
    - [ ] Implement Asset entity and repository
    - [ ] Implement Watchlist entity and repository
    - [ ] Create portfolio CRUD endpoints
    - [ ] Create asset management endpoints (portfolio-scoped)
    - [ ] Create watchlist endpoints (portfolio-scoped)

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

- Missing core business logic modules (Portfolio-based Asset, Transaction, Reports)
- No caching strategy implemented
- Limited test coverage
- Missing refresh token functionality
- No background jobs for price updates
- No rate limiting or advanced security features

### 📁 Key File Locations

- **Completed**: `src/modules/auth/`, `src/modules/user/`, `src/modules/provider/`, `src/core/configs/`
- **Empty/Missing**: `src/modules/asset/` (portfolio, asset, watchlist), `src/modules/transaction/`, `src/modules/reports/`

### 🏗️ Portfolio Architecture Notes

- **Portfolio-First Design**: All assets, watchlists, and transactions belong to specific portfolios
- **Multi-Portfolio Support**: Users can have multiple portfolios (e.g., "Main", "Trading", "DCA")
- **Consolidated Module**: Asset management, watchlists, and portfolios unified under single AssetModule
- **Scalable Reporting**: Portfolio-specific and cross-portfolio analytics support

---

**Last Updated**: 23 May 2025  
**Next Review**: Complete Phase 2 tasks
