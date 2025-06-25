# Self-Contained Portfolio Tracking: Implementation Plan

**Generated**: January 2025  
**Architecture**: Token Data Model (No Global Tokens)  
**Strategy**: Hexagonal Architecture progression (Domain → Application → Infrastructure)  
**Goal**: Ship working features quickly while supporting all advanced requirements

---

## Executive Summary

This plan eliminates the global tokens table complexity by storing token information directly in portfolio holdings and transactions. Holdings are simplified to only track token symbols (used as CoinGecko ref_id), while all quantity/price data flows through transactions. This approach removes pre-population barriers and enables immediate user onboarding while preserving all advanced features.

**Key Benefits:**

- ✅ Zero global state - fully self-contained per user
- ✅ Instant user onboarding - no token pre-population needed
- ✅ Natural UX - users type symbols directly (BTC, ETH, etc.)
- ✅ Auto-enhancement - system fetches metadata automatically
- ✅ Holdings simplified - only symbol registration, data flows through transactions
- ✅ All advanced features preserved - P&L, snapshots, analytics

**Key Architectural Changes:**

- Holdings only store token symbol (no quantity/price) - CREATE/DELETE only
- Transactions drive all portfolio calculations
- Token data in both holdings and transactions
- Hexagonal Architecture progression: Domain → Application → Infrastructure

---

## Database Schema Design

### Core Tables

```sql
-- Portfolios (already implemented)
CREATE TABLE portfolios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by_id UUID,
    updated_by_id UUID,
    deleted_at TIMESTAMP,
    deleted_by_id UUID
);

-- Holdings with  token data (simplified - no quantities)
CREATE TABLE portfolio_holdings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE,

    -- token information (no foreign key)
    token_symbol VARCHAR(20) NOT NULL,
    ref_id VARCHAR(20) NOT NULL,
    token_name VARCHAR(100),
    token_decimals INTEGER DEFAULT 18,
    token_logo_url TEXT,
    is_stablecoin BOOLEAN DEFAULT false,
    stablecoin_peg VARCHAR(10), -- 'USD', 'EUR', etc.

    -- No quantity/price data - comes from transactions
    created_at TIMESTAMP DEFAULT NOW(),
    created_by_id UUID,
    deleted_at TIMESTAMP,
    deleted_by_id UUID,

    UNIQUE(portfolio_id, token_symbol)
);

-- Transactions with  token data (drives all calculations)
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE,

    -- token information
    token_symbol VARCHAR(20) NOT NULL,
    token_name VARCHAR(100),
    token_decimals INTEGER DEFAULT 18,
    token_logo_url TEXT,

    -- Transaction details
    amount DECIMAL(30,18) NOT NULL, -- Positive = add to portfolio, Negative = remove
    price_per_token DECIMAL(30,18) CHECK (price_per_token >= 0),
    transaction_type VARCHAR(20) NOT NULL, -- 'BUY', 'SELL', 'DEPOSIT', 'WITHDRAWAL', 'SWAP'
    cash_flow DECIMAL(30,18), -- Net cash impact (negative = money out, positive = money in)
    fees DECIMAL(30,18) DEFAULT 0,
    transaction_date TIMESTAMP NOT NULL,
    external_transaction_id VARCHAR(100), -- For linking swap transactions
    notes TEXT,

    -- Portfolio impact tracking
    portfolio_value_before DECIMAL(30,18),
    portfolio_value_after DECIMAL(30,18),

    -- Audit fields
    created_at TIMESTAMP DEFAULT NOW(),
    created_by_id UUID,
    updated_at TIMESTAMP DEFAULT NOW(),
    updated_by_id UUID,
    deleted_at TIMESTAMP,
    deleted_by_id UUID
);

-- Token swaps linking table
CREATE TABLE token_swaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE,
    from_transaction_id UUID REFERENCES transactions(id),
    to_transaction_id UUID REFERENCES transactions(id),
    swap_rate DECIMAL(30,18) NOT NULL, -- How many TO tokens per FROM token
    transaction_date TIMESTAMP NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Lightweight price cache (no foreign keys)
CREATE TABLE token_price_cache (
    token_symbol VARCHAR(20) PRIMARY KEY, -- Use symbol as primary key
    token_name VARCHAR(100),
    price_usd DECIMAL(30,18) NOT NULL,
    market_cap DECIMAL(30,2),
    volume_24h DECIMAL(30,2),
    price_change_24h DECIMAL(10,4),
    price_change_7d DECIMAL(10,4),
    price_change_30d DECIMAL(10,4),
    last_updated TIMESTAMP NOT NULL,
    data_source VARCHAR(50) DEFAULT 'coingecko',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Portfolio snapshots for historical tracking
CREATE TABLE portfolio_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE,
    snapshot_date DATE NOT NULL,
    snapshot_time TIMESTAMP NOT NULL,
    snapshot_type VARCHAR(20) NOT NULL, -- 'daily', 'transaction', 'manual', 'weekly', 'monthly'

    -- Portfolio metrics at snapshot time
    total_value DECIMAL(30,18) NOT NULL,
    total_cost_basis DECIMAL(30,18) NOT NULL,
    total_pnl DECIMAL(30,18) NOT NULL,
    pnl_percentage DECIMAL(10,4) NOT NULL,
    holdings_count INTEGER NOT NULL,

    -- data for this snapshot
    holdings_data JSONB, -- [{symbol, quantity, price, value, cost_basis, pnl, weight}...]
    price_data JSONB,    -- {btc: {price: 43000, source: 'coingecko', timestamp: '...'}}

    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(portfolio_id, snapshot_date, snapshot_type)
);

-- Cash flow tracking for stablecoins and fiat
CREATE TABLE cash_flows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES transactions(id),
    token_symbol VARCHAR(20) NOT NULL, -- Which stablecoin or fiat
    amount DECIMAL(30,18) NOT NULL, -- Positive = money in, Negative = money out
    flow_type VARCHAR(20) NOT NULL, -- 'DEPOSIT', 'WITHDRAWAL', 'SWAP_IN', 'SWAP_OUT'
    usd_value DECIMAL(30,18) NOT NULL, -- USD equivalent
    transaction_date TIMESTAMP NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Price update job tracking
CREATE TABLE price_update_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_type VARCHAR(20) NOT NULL, -- 'MANUAL', 'SCHEDULED', 'USER_TRIGGERED'
    status VARCHAR(20) NOT NULL, -- 'PENDING', 'RUNNING', 'COMPLETED', 'FAILED'
    tokens_to_update TEXT[], -- Array of token symbols to update
    tokens_updated INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    error_message TEXT,
    triggered_by UUID, -- User ID for manual updates
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Performance Indexes

```sql
-- Holdings indexes
CREATE INDEX idx_holdings_portfolio ON portfolio_holdings(portfolio_id);
CREATE INDEX idx_holdings_symbol ON portfolio_holdings(token_symbol);

-- Transaction indexes
CREATE INDEX idx_transactions_portfolio_date ON transactions(portfolio_id, transaction_date DESC);
CREATE INDEX idx_transactions_symbol ON transactions(token_symbol);
CREATE INDEX idx_transactions_type ON transactions(transaction_type);
CREATE INDEX idx_transactions_external_id ON transactions(external_transaction_id);

-- Snapshot indexes
CREATE INDEX idx_snapshots_portfolio_date ON portfolio_snapshots(portfolio_id, snapshot_date DESC);
CREATE INDEX idx_snapshots_type ON portfolio_snapshots(snapshot_type, snapshot_date DESC);

-- Price cache indexes
CREATE INDEX idx_price_cache_updated ON token_price_cache(last_updated);

-- Cash flow indexes
CREATE INDEX idx_cash_flows_portfolio_date ON cash_flows(portfolio_id, transaction_date DESC);
CREATE INDEX idx_cash_flows_type ON cash_flows(flow_type);

-- Audit and soft delete indexes
CREATE INDEX idx_holdings_deleted ON portfolio_holdings(deleted_at);
CREATE INDEX idx_transactions_deleted ON transactions(deleted_at);
```

---

## API Design

### Core Portfolio Management ✅ COMPLETED

#### Portfolio CRUD (Already Implemented ✅)

- `POST /portfolios` - Create portfolio ✅
- `GET /portfolios` - List user portfolios ✅
- `GET /portfolios/:id` - Get portfolio details ✅
- `PUT /portfolios/:id` - Update portfolio ✅
- `DELETE /portfolios/:id` - Delete portfolio ✅

#### Holdings Management (Simplified Model)

**Register Token in Portfolio**

```
POST /portfolios/:portfolioId/holdings
Body: {
  "token_symbol": "BTC"           // Required - user enters this (used as CoinGecko ref_id)
}

Logic:
1. Validate token_symbol format
2. Search CoinGecko API for token metadata (name, decimals, logo)
3. Check if holding already exists for this symbol in portfolio
4. If exists: Return existing holding
5. If new: Create new holding with auto-fetched metadata
6. Return enriched holding data
```

**Get Portfolio Holdings (with calculated data)**

```
GET /portfolios/:portfolioId/holdings?include_prices=true

Response: [
  {
    "id": "uuid",
    "token_symbol": "BTC",
    "token_name": "Bitcoin",
    "token_logo_url": "https://...",
    "quantity": 0.5,                     // Calculated from transactions
    "average_buy_price": 45000,          // Calculated from transactions
    "total_cost_basis": 22500,           // Calculated from transactions
    "current_price": 47000,              // If include_prices=true
    "current_value": 23500,              // If include_prices=true
    "pnl": 1000,                         // If include_prices=true
    "pnl_percentage": 4.44,              // If include_prices=true
    "weight_percentage": 25.5,           // Percentage of portfolio
    "first_purchase_date": "2025-01-01",
    "last_transaction_date": "2025-01-15"
  }
]

Logic:
1. Get all holdings for portfolio (where deleted_at IS NULL)
2. Calculate quantity/price data from transactions
3. If include_prices=true, fetch current prices from cache
4. Calculate current values, P&L, and weights
5. Return sorted by value (largest first)
```

**Remove Token from Portfolio**

```
DELETE /portfolios/:portfolioId/holdings/:holdingId

Logic:
1. Validate ownership (holding belongs to user's portfolio)
2. Soft delete holding (sets deleted_at)
3. Note: Historical transactions remain for audit trail
```

#### Transaction Management (Core Feature)

**Add Transaction**

```
POST /portfolios/:portfolioId/transactions
Body: {
  "token_symbol": "ETH",
  "transaction_type": "BUY",       // BUY, SELL, DEPOSIT, WITHDRAWAL
  "amount": 2.5,                   // Positive for BUY/DEPOSIT, negative for SELL/WITHDRAWAL
  "price_per_token": 2500,
  "transaction_date": "2025-01-15",
  "fees": 25,
  "notes": "Coinbase purchase"
}

Logic:
1. Validate and enrich token data from CoinGecko
2. Auto-create holding if doesn't exist for this token
3. Create transaction record
4. Calculate portfolio impact (value before/after)
5. Create transaction snapshot
6. Return transaction with updated portfolio state
```

**Token Swap**

```
POST /portfolios/:portfolioId/transactions/swap
Body: {
  "from_token_symbol": "USDT",
  "from_amount": 1000,
  "to_token_symbol": "BTC",
  "to_amount": 0.02127,
  "transaction_date": "2025-01-15",
  "notes": "DEX swap on Uniswap"
}

Logic:
1. Validate both tokens and enrich metadata
2. Auto-create holdings for both tokens if needed
3. Create two linked transactions (SELL from_token, BUY to_token)
4. Create swap record linking the transactions
5. Record cash flows if stablecoins involved
6. Create transaction snapshot
7. Return swap details with updated portfolio state
```

**Get Transaction History**

```
GET /portfolios/:portfolioId/transactions?limit=50&offset=0&type=BUY&token_symbol=BTC

Response: [
  {
    "id": "uuid",
    "token_symbol": "BTC",
    "token_name": "Bitcoin",
    "transaction_type": "BUY",
    "amount": 0.5,
    "price_per_token": 45000,
    "total_value": 22500,
    "fees": 50,
    "transaction_date": "2025-01-01T10:00:00Z",
    "notes": "DCA purchase",
    "portfolio_value_before": 50000,
    "portfolio_value_after": 72450
  }
]
```

### Advanced Features APIs

#### Real-Time P&L Tracking

**Current Portfolio Performance**

```
GET /portfolios/:portfolioId/performance

Response: {
  "total_value": 85000,
  "total_cost_basis": 75000,
  "total_pnl": 10000,
  "pnl_percentage": 13.33,
  "holdings_count": 5,
  "best_performer": {
    "token_symbol": "SOL",
    "pnl_percentage": 45.2
  },
  "worst_performer": {
    "token_symbol": "ADA",
    "pnl_percentage": -12.5
  },
  "last_updated": "2025-01-15T14:30:00Z"
}

Logic:
1. Calculate holdings from transactions
2. Fetch current prices from cache (refresh if stale)
3. Calculate current values and P&L for each holding
4. Aggregate portfolio totals
5. Identify best/worst performers
6. Cache result for 1 minute to reduce DB load
```

**Portfolio Value Over Time**

```
GET /portfolios/:portfolioId/performance/history?period=30d&resolution=daily

Response: {
  "period": "30d",
  "resolution": "daily",
  "data_points": 30,
  "chart_data": [
    {
      "date": "2025-01-01",
      "total_value": 75000,
      "total_pnl": 5000,
      "pnl_percentage": 7.14
    }
  ],
  "period_summary": {
    "start_value": 70000,
    "end_value": 85000,
    "period_return": 15000,
    "period_return_percentage": 21.43,
    "best_day": "2025-01-10",
    "worst_day": "2025-01-05"
  }
}
```

#### Price Updates

**Manual Price Refresh**

```
POST /portfolios/:portfolioId/prices/refresh

Logic:
1. Get all unique token symbols from portfolio transactions
2. Create price update job record
3. Queue background job to fetch prices from CoinGecko
4. Update token_price_cache table
5. Return job ID for status polling
```

#### Snapshots and Historical Tracking

**Create Manual Snapshot**

```
POST /portfolios/:portfolioId/snapshots

Logic:
1. Calculate current portfolio metrics from transactions
2. Get current prices for all tokens
3. Create portfolio_snapshots record with type 'manual'
4. Store detailed holdings_data and price_data in JSONB
5. Return snapshot summary
```

#### Reports and Analytics

**Portfolio Summary Report**

```
GET /portfolios/:portfolioId/reports/summary?period=90d

Response: {
  "period": "90d",
  "portfolio_performance": {
    "start_value": 60000,
    "end_value": 85000,
    "total_return": 25000,
    "total_return_percentage": 41.67
  },
  "top_holdings": [
    {
      "token_symbol": "BTC",
      "percentage_of_portfolio": 27.6,
      "pnl_percentage": 15.2
    }
  ],
  "activity_summary": {
    "total_transactions": 45,
    "total_fees_paid": 250,
    "most_traded_token": "ETH"
  }
}
```

---

## Success Metrics

### Technical Metrics

- [ ] Portfolio creation time: <2 seconds
- [ ] Holdings calculation time: <300ms for 50 transactions
- [ ] Price update frequency: Every 5 minutes
- [ ] Historical query performance: <1 second for 1 year of data
- [ ] 99.9% uptime for core functionality

### User Experience Metrics

- [ ] Time from signup to first holding: <1 minute
- [ ] Token addition success rate: >95% for top 500 tokens
- [ ] Zero pre-population required
- [ ] Intuitive symbol-based token entry
- [ ] Real-time P&L updates visible immediately

### Business Metrics

- [ ] User onboarding completion rate: >80%
- [ ] Daily active users tracking portfolios
- [ ] Feature adoption rate for advanced analytics
- [ ] User retention after 1 week/1 month
- [ ] Time to share with friends: <1 week after completion

---

## Risk Mitigation

### Data Migration Risks

- **Risk**: Existing data loss during schema changes
- **Mitigation**: Comprehensive backup, staged migration, rollback plan

### External API Dependency

- **Risk**: CoinGecko API failures or rate limits
- **Mitigation**: Fallback APIs, graceful degradation, local caching

### Performance Under Load

- **Risk**: Slow response times with transaction-based calculations
- **Mitigation**: Strategic caching, database optimization, pre-computed snapshots

### Token Data Accuracy

- **Risk**: Incorrect or missing token metadata
- **Mitigation**: Multiple data sources, user correction features, validation

This implementation plan prioritizes hexagonal architecture progression and shipping working features quickly. Holdings are simplified to token registration only, with all financial data flowing through transactions. Each checkpoint has clear validation criteria focusing on unit tests while making integration tests optional.
