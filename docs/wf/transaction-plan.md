# Hybrid Portfolio Tracking: Complete Design Guide

## Database Schema Design

### Core Entities

```sql
-- Tokens/Assets (minimal storage)
CREATE TABLE tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    coingecko_id VARCHAR(100),
    decimals INTEGER DEFAULT 18,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Current prices only (hot cache)
CREATE TABLE token_prices_current (
    token_id UUID REFERENCES tokens(id),
    price_usd DECIMAL(20,8) NOT NULL,
    market_cap DECIMAL(20,2),
    volume_24h DECIMAL(20,2),
    price_change_24h DECIMAL(10,4),
    last_updated TIMESTAMP NOT NULL,
    data_source VARCHAR(50) NOT NULL,
    PRIMARY KEY (token_id)
);

-- Portfolios
CREATE TABLE portfolios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Portfolio holdings (current state)
CREATE TABLE portfolio_holdings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID REFERENCES portfolios(id),
    token_id UUID REFERENCES tokens(id),
    quantity DECIMAL(20,8) NOT NULL,
    average_buy_price DECIMAL(20,8) NOT NULL,
    total_cost_basis DECIMAL(20,8) NOT NULL,
    first_purchase_date TIMESTAMP,
    last_transaction_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(portfolio_id, token_id)
);
```

### Key Innovation: Snapshot Tables

```sql
-- Portfolio value snapshots (the secret sauce)
CREATE TABLE portfolio_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID REFERENCES portfolios(id),
    snapshot_date DATE NOT NULL,
    snapshot_time TIMESTAMP NOT NULL,
    total_value DECIMAL(20,8) NOT NULL,
    total_cost_basis DECIMAL(20,8) NOT NULL,
    total_pnl DECIMAL(20,8) NOT NULL,
    pnl_percentage DECIMAL(10,4) NOT NULL,
    snapshot_type VARCHAR(20) NOT NULL, -- 'daily', 'transaction', 'manual'
    holdings_count INTEGER NOT NULL,
    metadata JSONB, -- Store additional context
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(portfolio_id, snapshot_date, snapshot_type)
);

-- Single-direction transactions with cash flow tracking
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID REFERENCES portfolios(id),
    token_id UUID REFERENCES tokens(id),
    amount DECIMAL(20,8) NOT NULL, -- Positive = add to portfolio, Negative = remove from portfolio
    price_per_token DECIMAL(20,8), -- Price at time of transaction (can be null for transfers)
    transaction_type VARCHAR(20) NOT NULL, -- 'TRADE', 'DEPOSIT', 'WITHDRAWAL', 'TRANSFER_IN', 'TRANSFER_OUT'
    cash_flow DECIMAL(20,8), -- Net cash impact (negative = money out, positive = money in)
    fees DECIMAL(20,8) DEFAULT 0,
    transaction_date TIMESTAMP NOT NULL,
    external_transaction_id VARCHAR(100), -- Link related transactions (for swaps)
    notes TEXT,
    -- Snapshot data at transaction time
    portfolio_value_before DECIMAL(20,8),
    portfolio_value_after DECIMAL(20,8),
    created_at TIMESTAMP DEFAULT NOW()
);

-- For token swaps, we also need a swap table to link transactions
CREATE TABLE token_swaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID REFERENCES portfolios(id),
    from_transaction_id UUID REFERENCES transactions(id), -- SELL transaction
    to_transaction_id UUID REFERENCES transactions(id),   -- BUY transaction
    swap_rate DECIMAL(20,8), -- How many TO tokens per FROM token
    transaction_date TIMESTAMP NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Cash flow tracking for stablecoin deposits/withdrawals
CREATE TABLE cash_flows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID REFERENCES portfolios(id),
    transaction_id UUID REFERENCES transactions(id),
    token_id UUID REFERENCES tokens(id), -- Which stablecoin (USDT, USDC, etc.)
    amount DECIMAL(20,8) NOT NULL, -- Positive = deposit, Negative = withdrawal
    flow_type VARCHAR(20) NOT NULL, -- 'DEPOSIT', 'WITHDRAWAL', 'SWAP_IN', 'SWAP_OUT'
    usd_value DECIMAL(20,8) NOT NULL, -- USD equivalent (for non-USD stablecoins)
    transaction_date TIMESTAMP NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Mark stablecoins for easy identification
ALTER TABLE tokens ADD COLUMN is_stablecoin BOOLEAN DEFAULT false;
ALTER TABLE tokens ADD COLUMN stablecoin_peg VARCHAR(10); -- 'USD', 'EUR', etc.

-- Indexes for performance (updated for new schema)
CREATE INDEX idx_portfolio_snapshots_portfolio_date ON portfolio_snapshots(portfolio_id, snapshot_date DESC);
CREATE INDEX idx_portfolio_snapshots_type ON portfolio_snapshots(snapshot_type, snapshot_date DESC);
CREATE INDEX idx_transactions_portfolio_date ON transactions(portfolio_id, transaction_date DESC);
CREATE INDEX idx_transactions_external_id ON transactions(external_transaction_id);
CREATE INDEX idx_holdings_portfolio ON portfolio_holdings(portfolio_id);
CREATE INDEX idx_cash_flows_portfolio_date ON cash_flows(portfolio_id, transaction_date DESC);
CREATE INDEX idx_cash_flows_type ON cash_flows(flow_type, transaction_date DESC);
CREATE INDEX idx_token_swaps_portfolio ON token_swaps(portfolio_id, transaction_date DESC);
```

## Snapshot Strategy

### 1. Snapshot Types and Triggers

```javascript
const SNAPSHOT_TYPES = {
    DAILY: 'daily', // Automated daily snapshots
    TRANSACTION: 'transaction', // Triggered by buy/sell
    MANUAL: 'manual', // User-requested snapshot
    WEEKLY: 'weekly', // Weekly summary
    MONTHLY: 'monthly', // Monthly summary
};

class SnapshotService {
    constructor(db, priceService) {
        this.db = db;
        this.priceService = priceService;
    }

    // Trigger snapshot on transaction
    async onTransactionComplete(transaction) {
        await this.createSnapshot(transaction.portfolio_id, SNAPSHOT_TYPES.TRANSACTION, transaction.transaction_date);
    }

    // Daily automated snapshots
    async createDailySnapshots() {
        const activePortfolios = await this.db.getActivePortfolios();

        for (const portfolio of activePortfolios) {
            try {
                await this.createSnapshot(portfolio.id, SNAPSHOT_TYPES.DAILY, new Date());
            } catch (error) {
                console.error(`Failed to create daily snapshot for portfolio ${portfolio.id}:`, error);
            }
        }
    }

    async createSnapshot(portfolioId, type, timestamp = new Date()) {
        const holdings = await this.db.getPortfolioHoldings(portfolioId);
        if (holdings.length === 0) return;

        // Get current prices for all tokens in portfolio
        const tokenIds = holdings.map((h) => h.token_id);
        const currentPrices = await this.priceService.getCurrentPrices(tokenIds);

        let totalValue = 0;
        let totalCostBasis = 0;
        const holdingSnapshots = [];

        // Calculate current values
        for (const holding of holdings) {
            const currentPrice = currentPrices[holding.token_id]?.price_usd || 0;
            const currentValue = holding.quantity * currentPrice;
            const pnl = currentValue - holding.total_cost_basis;

            totalValue += currentValue;
            totalCostBasis += holding.total_cost_basis;

            holdingSnapshots.push({
                token_id: holding.token_id,
                token_symbol: holding.token_symbol,
                quantity: holding.quantity,
                price_at_snapshot: currentPrice,
                value_at_snapshot: currentValue,
                cost_basis: holding.total_cost_basis,
                pnl: pnl,
                weight_percentage: 0, // Calculate after we have totalValue
            });
        }

        // Calculate weight percentages
        holdingSnapshots.forEach((h) => {
            h.weight_percentage = totalValue > 0 ? (h.value_at_snapshot / totalValue) * 100 : 0;
        });

        const totalPnL = totalValue - totalCostBasis;
        const pnlPercentage = totalCostBasis > 0 ? (totalPnL / totalCostBasis) * 100 : 0;

        // Save snapshot
        const snapshot = await this.db.createPortfolioSnapshot({
            portfolio_id: portfolioId,
            snapshot_date: timestamp.toISOString().split('T')[0],
            snapshot_time: timestamp,
            total_value: totalValue,
            total_cost_basis: totalCostBasis,
            total_pnl: totalPnL,
            pnl_percentage: pnlPercentage,
            snapshot_type: type,
            holdings_count: holdings.length,
            metadata: {
                price_sources: Object.keys(currentPrices).map((tokenId) => ({
                    token_id: tokenId,
                    source: currentPrices[tokenId].data_source,
                    last_updated: currentPrices[tokenId].last_updated,
                })),
            },
        });

        // Save detailed holdings if needed (optional for storage optimization)
        if (type === SNAPSHOT_TYPES.TRANSACTION || type === SNAPSHOT_TYPES.MONTHLY) {
            await this.db.createSnapshotHoldings(snapshot.id, holdingSnapshots);
        }

        return snapshot;
    }
}
```

### 2. Background Jobs Setup

```javascript
// Cron jobs for automated snapshots
class SnapshotScheduler {
    constructor(snapshotService) {
        this.snapshotService = snapshotService;
    }

    setupSchedules() {
        // Daily snapshots at 11:59 PM UTC
        cron.schedule('59 23 * * *', async () => {
            console.log('Creating daily portfolio snapshots...');
            await this.snapshotService.createDailySnapshots();
        });

        // Weekly snapshots every Sunday
        cron.schedule('0 0 * * 0', async () => {
            console.log('Creating weekly portfolio snapshots...');
            await this.snapshotService.createWeeklySnapshots();
        });

        // Monthly snapshots on the 1st of each month
        cron.schedule('0 0 1 * *', async () => {
            console.log('Creating monthly portfolio snapshots...');
            await this.snapshotService.createMonthlySnapshots();
        });
    }
}
```

## API Design

### Portfolio Performance Endpoints

```javascript
// GET /portfolios/:id/performance
app.get('/portfolios/:id/performance', async (req, res) => {
    const { period = '30d', detail = 'summary' } = req.query;

    try {
        const performance = await portfolioService.getPerformance(req.params.id, period, detail);
        res.json(performance);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /portfolios/:id/snapshots
app.get('/portfolios/:id/snapshots', async (req, res) => {
    const { from_date, to_date, type = 'daily', limit = 30 } = req.query;

    try {
        const snapshots = await portfolioService.getSnapshots(req.params.id, { from_date, to_date, type, limit });
        res.json(snapshots);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /portfolios/:id/snapshots (manual snapshot)
app.post('/portfolios/:id/snapshots', async (req, res) => {
    try {
        const snapshot = await snapshotService.createSnapshot(req.params.id, SNAPSHOT_TYPES.MANUAL);
        res.json(snapshot);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
```

### Service Layer Implementation

```javascript
class PortfolioService {
    constructor(db, priceService, snapshotService) {
        this.db = db;
        this.priceService = priceService;
        this.snapshotService = snapshotService;
    }

    async getPerformance(portfolioId, period, detail) {
        const current = await this.getCurrentPerformance(portfolioId);
        const historical = await this.getHistoricalPerformance(portfolioId, period);

        const result = {
            current: current,
            period: period,
            historical: {
                start_value: historical.startValue,
                end_value: historical.endValue,
                total_return: historical.totalReturn,
                total_return_percentage: historical.totalReturnPercentage,
                data_points: detail === 'detailed' ? historical.snapshots : historical.snapshots.length,
            },
        };

        if (detail === 'detailed') {
            result.chart_data = historical.snapshots.map((s) => ({
                date: s.snapshot_date,
                value: s.total_value,
                pnl: s.total_pnl,
                pnl_percentage: s.pnl_percentage,
            }));
        }

        return result;
    }

    async getCurrentPerformance(portfolioId) {
        const holdings = await this.db.getPortfolioHoldings(portfolioId);
        const tokenIds = holdings.map((h) => h.token_id);
        const currentPrices = await this.priceService.getCurrentPrices(tokenIds);

        let totalValue = 0;
        let totalCostBasis = 0;

        for (const holding of holdings) {
            const currentPrice = currentPrices[holding.token_id]?.price_usd || 0;
            const currentValue = holding.quantity * currentPrice;

            totalValue += currentValue;
            totalCostBasis += holding.total_cost_basis;
        }

        const totalPnL = totalValue - totalCostBasis;
        const pnlPercentage = totalCostBasis > 0 ? (totalPnL / totalCostBasis) * 100 : 0;

        return {
            total_value: totalValue,
            total_cost_basis: totalCostBasis,
            total_pnl: totalPnL,
            pnl_percentage: pnlPercentage,
            holdings_count: holdings.length,
            last_updated: new Date(),
        };
    }

    async getHistoricalPerformance(portfolioId, period) {
        const fromDate = this.calculateFromDate(period);

        const snapshots = await this.db.getPortfolioSnapshots(portfolioId, {
            from_date: fromDate,
            type: 'daily',
            order: 'ASC',
        });

        if (snapshots.length === 0) {
            throw new Error('No historical data available for this period');
        }

        const startValue = snapshots[0].total_value;
        const endValue = snapshots[snapshots.length - 1].total_value;
        const totalReturn = endValue - startValue;
        const totalReturnPercentage = startValue > 0 ? (totalReturn / startValue) * 100 : 0;

        return {
            startValue,
            endValue,
            totalReturn,
            totalReturnPercentage,
            snapshots: snapshots,
        };
    }

    calculateFromDate(period) {
        const now = new Date();
        switch (period) {
            case '7d':
                return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            case '30d':
                return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            case '90d':
                return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            case '1y':
                return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            default:
                return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }
    }
}
```

## Updated Transaction Processing

### Understanding the New Schema

#### Single-Direction Transaction Records

```javascript
// Example transactions in the new schema:

// 1. Direct USDT deposit to portfolio
{
  token_id: 'usdt_id',
  amount: 1000,           // +1000 USDT added to portfolio
  price_per_token: 1.0,   // USDT price
  transaction_type: 'DEPOSIT',
  cash_flow: -1000        // $1000 cash went out of your bank account
}

// 2. Buy BTC with cash (not using existing portfolio tokens)
{
  token_id: 'btc_id',
  amount: 0.5,            // +0.5 BTC added to portfolio
  price_per_token: 50000, // BTC was $50,000
  transaction_type: 'TRADE',
  cash_flow: -25000       // $25,000 cash went out
}

// 3. USDT → BTC swap (creates 2 transactions)
// Transaction 1: Sell USDT
{
  token_id: 'usdt_id',
  amount: -1000,          // -1000 USDT removed from portfolio
  price_per_token: 1.0,
  transaction_type: 'TRADE',
  cash_flow: 0,           // No external cash flow (internal swap)
  external_transaction_id: 'swap_123'
}
// Transaction 2: Buy BTC
{
  token_id: 'btc_id',
  amount: 0.02,           // +0.02 BTC added to portfolio
  price_per_token: 50000,
  transaction_type: 'TRADE',
  cash_flow: 0,           // No external cash flow (internal swap)
  external_transaction_id: 'swap_123'
}

// 4. Withdraw USDT from portfolio
{
  token_id: 'usdt_id',
  amount: -500,           // -500 USDT removed from portfolio
  price_per_token: 1.0,
  transaction_type: 'WITHDRAWAL',
  cash_flow: 500          // $500 cash came into your bank account
}
```

### Transaction Service Implementation

```javascript
class TransactionService {
    constructor(db, portfolioService, snapshotService) {
        this.db = db;
        this.portfolioService = portfolioService;
        this.snapshotService = snapshotService;
    }

    // Handle simple deposit/withdrawal/direct trades
    async processSimpleTransaction(transactionData) {
        const transaction = await this.db.transaction(async (trx) => {
            const beforeSnapshot = await this.portfolioService.getCurrentPerformance(transactionData.portfolio_id);

            const transaction = await this.db.createTransaction(
                {
                    ...transactionData,
                    portfolio_value_before: beforeSnapshot.total_value,
                },
                trx,
            );

            await this.updateHoldings(transaction, trx);

            // Track cash flow if it's a stablecoin
            if (await this.isStablecoin(transaction.token_id)) {
                await this.recordCashFlow(transaction, trx);
            }

            const afterPerformance = await this.portfolioService.getCurrentPerformance(transactionData.portfolio_id);

            await this.db.updateTransaction(
                transaction.id,
                {
                    portfolio_value_after: afterPerformance.total_value,
                },
                trx,
            );

            return transaction;
        });

        await this.snapshotService.createSnapshot(
            transaction.portfolio_id,
            SNAPSHOT_TYPES.TRANSACTION,
            transaction.transaction_date,
        );

        return transaction;
    }

    // Handle token swaps (USDT → BTC)
    async processTokenSwap(swapData) {
        const {
            portfolio_id,
            from_token_id,
            from_amount, // Amount of token being sold (positive number)
            to_token_id,
            to_amount, // Amount of token being bought (positive number)
            swap_rate, // How many TO tokens per FROM token
            transaction_date,
            notes,
        } = swapData;

        const result = await this.db.transaction(async (trx) => {
            const beforeSnapshot = await this.portfolioService.getCurrentPerformance(portfolio_id);
            const externalTxId = `swap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            // Get current prices for both tokens
            const fromPrice = await this.priceService.getCurrentPrice(from_token_id);
            const toPrice = await this.priceService.getCurrentPrice(to_token_id);

            // Transaction 1: Remove the FROM token (sell)
            const sellTransaction = await this.db.createTransaction(
                {
                    portfolio_id,
                    token_id: from_token_id,
                    amount: -from_amount, // Negative = removing from portfolio
                    price_per_token: fromPrice,
                    transaction_type: 'TRADE',
                    cash_flow: 0, // No external cash flow
                    external_transaction_id: externalTxId,
                    transaction_date,
                    notes: `Swap: Sell ${from_amount} tokens`,
                    portfolio_value_before: beforeSnapshot.total_value,
                },
                trx,
            );

            // Transaction 2: Add the TO token (buy)
            const buyTransaction = await this.db.createTransaction(
                {
                    portfolio_id,
                    token_id: to_token_id,
                    amount: to_amount, // Positive = adding to portfolio
                    price_per_token: toPrice,
                    transaction_type: 'TRADE',
                    cash_flow: 0, // No external cash flow
                    external_transaction_id: externalTxId,
                    transaction_date,
                    notes: `Swap: Buy ${to_amount} tokens`,
                    portfolio_value_before: beforeSnapshot.total_value,
                },
                trx,
            );

            // Update holdings for both tokens
            await this.updateHoldings(sellTransaction, trx);
            await this.updateHoldings(buyTransaction, trx);

            // Record cash flows if stablecoins are involved
            if (await this.isStablecoin(from_token_id)) {
                await this.recordCashFlow(
                    {
                        ...sellTransaction,
                        flow_type: 'SWAP_OUT',
                    },
                    trx,
                );
            }

            if (await this.isStablecoin(to_token_id)) {
                await this.recordCashFlow(
                    {
                        ...buyTransaction,
                        flow_type: 'SWAP_IN',
                    },
                    trx,
                );
            }

            // Create swap record linking the two transactions
            const swap = await this.db.AddTokenSwap(
                {
                    portfolio_id,
                    from_transaction_id: sellTransaction.id,
                    to_transaction_id: buyTransaction.id,
                    swap_rate,
                    transaction_date,
                    notes,
                },
                trx,
            );

            const afterPerformance = await this.portfolioService.getCurrentPerformance(portfolio_id);

            // Update both transactions with after value
            await this.db.updateTransaction(
                sellTransaction.id,
                {
                    portfolio_value_after: afterPerformance.total_value,
                },
                trx,
            );

            await this.db.updateTransaction(
                buyTransaction.id,
                {
                    portfolio_value_after: afterPerformance.total_value,
                },
                trx,
            );

            return {
                swap,
                sellTransaction,
                buyTransaction,
            };
        });

        // Create snapshot after the swap
        await this.snapshotService.createSnapshot(portfolio_id, SNAPSHOT_TYPES.TRANSACTION, swapData.transaction_date);

        return result;
    }

    async updateHoldings(transaction, trx) {
        const existingHolding = await this.db.getHolding(transaction.portfolio_id, transaction.token_id, trx);

        if (transaction.amount > 0) {
            // Adding tokens to portfolio
            if (existingHolding) {
                // Update existing holding
                const additionalCost = transaction.amount * (transaction.price_per_token || 0);
                const newTotalCost = existingHolding.total_cost_basis + additionalCost;
                const newQuantity = existingHolding.quantity + transaction.amount;
                const newAvgPrice = newQuantity > 0 ? newTotalCost / newQuantity : 0;

                await this.db.updateHolding(
                    existingHolding.id,
                    {
                        quantity: newQuantity,
                        average_buy_price: newAvgPrice,
                        total_cost_basis: newTotalCost,
                        last_transaction_date: transaction.transaction_date,
                    },
                    trx,
                );
            } else {
                // Create new holding
                await this.db.createHolding(
                    {
                        portfolio_id: transaction.portfolio_id,
                        token_id: transaction.token_id,
                        quantity: transaction.amount,
                        average_buy_price: transaction.price_per_token || 0,
                        total_cost_basis: transaction.amount * (transaction.price_per_token || 0),
                        first_purchase_date: transaction.transaction_date,
                        last_transaction_date: transaction.transaction_date,
                    },
                    trx,
                );
            }
        } else {
            // Removing tokens from portfolio
            if (!existingHolding) {
                throw new Error('Cannot remove token that is not held');
            }

            const removeAmount = Math.abs(transaction.amount);
            const newQuantity = existingHolding.quantity - removeAmount;

            if (newQuantity < 0) {
                throw new Error('Cannot remove more than held quantity');
            }

            if (newQuantity === 0) {
                // Remove holding completely
                await this.db.deleteHolding(existingHolding.id, trx);
            } else {
                // Reduce quantity (proportionally reduce cost basis)
                const proportionRemoved = removeAmount / existingHolding.quantity;
                const newCostBasis = existingHolding.total_cost_basis * (1 - proportionRemoved);

                await this.db.updateHolding(
                    existingHolding.id,
                    {
                        quantity: newQuantity,
                        total_cost_basis: newCostBasis,
                        last_transaction_date: transaction.transaction_date,
                    },
                    trx,
                );
            }
        }
    }

    async recordCashFlow(transaction, trx) {
        const usdValue = Math.abs(transaction.amount) * (transaction.price_per_token || 1);
        let flowType;

        if (transaction.transaction_type === 'DEPOSIT') {
            flowType = 'DEPOSIT';
        } else if (transaction.transaction_type === 'WITHDRAWAL') {
            flowType = 'WITHDRAWAL';
        } else if (transaction.transaction_type === 'TRADE') {
            flowType = transaction.amount > 0 ? 'SWAP_IN' : 'SWAP_OUT';
        }

        await this.db.createCashFlow(
            {
                portfolio_id: transaction.portfolio_id,
                transaction_id: transaction.id,
                token_id: transaction.token_id,
                amount: transaction.amount,
                flow_type: flowType,
                usd_value: transaction.amount > 0 ? usdValue : -usdValue,
                transaction_date: transaction.transaction_date,
                notes: transaction.notes,
            },
            trx,
        );
    }

    async isStablecoin(tokenId) {
        const token = await this.db.getToken(tokenId);
        return token?.is_stablecoin || false;
    }
}
```

## Data Retention Strategy

### Snapshot Cleanup Policy

```javascript
class SnapshotCleanupService {
    constructor(db) {
        this.db = db;
    }

    async cleanupOldSnapshots() {
        // Keep all transaction snapshots (important for audit)
        // Keep daily snapshots for 1 year
        // Keep weekly snapshots for 2 years
        // Keep monthly snapshots forever

        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

        const twoYearsAgo = new Date();
        twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

        // Delete old daily snapshots (keep 1 year)
        await this.db.query(
            `
      DELETE FROM portfolio_snapshots 
      WHERE snapshot_type = 'daily' 
      AND snapshot_date < $1
    `,
            [oneYearAgo],
        );

        // Delete old weekly snapshots (keep 2 years)
        await this.db.query(
            `
      DELETE FROM portfolio_snapshots 
      WHERE snapshot_type = 'weekly' 
      AND snapshot_date < $1
    `,
            [twoYearsAgo],
        );

        // Cleanup orphaned snapshot holdings
        await this.db.query(`
      DELETE FROM portfolio_snapshot_holdings 
      WHERE snapshot_id NOT IN (
        SELECT id FROM portfolio_snapshots
      )
    `);
    }

    // Run monthly
    setupCleanupSchedule() {
        cron.schedule('0 2 1 * *', async () => {
            console.log('Running snapshot cleanup...');
            await this.cleanupOldSnapshots();
        });
    }
}
```

## True P&L Calculation with Cash Flow Tracking

### Cash Flow Analysis Service

```javascript
class PnLAnalysisService {
    constructor(db) {
        this.db = db;
    }

    async calculateTruePnL(portfolioId, fromDate = null, toDate = null) {
        // Get all cash flows (money in/out of portfolio)
        const cashFlows = await this.db.getCashFlows(portfolioId, fromDate, toDate);

        // Get current portfolio value
        const currentPerformance = await this.portfolioService.getCurrentPerformance(portfolioId);

        // Calculate total money invested (net cash flow)
        const totalCashIn = cashFlows.filter((cf) => cf.usd_value > 0).reduce((sum, cf) => sum + cf.usd_value, 0);

        const totalCashOut = cashFlows
            .filter((cf) => cf.usd_value < 0)
            .reduce((sum, cf) => sum + Math.abs(cf.usd_value), 0);

        const netCashInvested = totalCashIn - totalCashOut;

        // True P&L = Current Value - Net Cash Invested
        const truePnL = currentPerformance.total_value - netCashInvested;
        const truePnLPercentage = netCashInvested > 0 ? (truePnL / netCashInvested) * 100 : 0;

        return {
            current_portfolio_value: currentPerformance.total_value,
            total_cash_invested: netCashInvested,
            total_cash_in: totalCashIn,
            total_cash_out: totalCashOut,
            true_pnl: truePnL,
            true_pnl_percentage: truePnLPercentage,
            cash_flows: cashFlows.map((cf) => ({
                date: cf.transaction_date,
                amount: cf.usd_value,
                type: cf.flow_type,
                token: cf.token_symbol,
            })),
        };
    }

    // Enhanced portfolio performance that considers cash flows
    async getEnhancedPerformance(portfolioId, period) {
        const basicPerformance = await this.portfolioService.getPerformance(portfolioId, period);
        const truePnL = await this.calculateTruePnL(portfolioId);

        return {
            ...basicPerformance,
            cash_flow_analysis: truePnL,
            // Compare basic P&L vs true P&L
            pnl_comparison: {
                holding_based_pnl: basicPerformance.current.total_pnl,
                cash_flow_based_pnl: truePnL.true_pnl,
                difference: truePnL.true_pnl - basicPerformance.current.total_pnl,
            },
        };
    }
}
```

### ✅ **What You Get**

- Current P&L calculation (always available)
- Historical performance tracking (30d, 90d, 1y)
- Portfolio value charts and trends
- Transaction impact analysis
- Reasonable storage requirements
- Fast query performance
- Audit trail for all changes

### ⚖️ **Trade-offs**

- **Storage**: ~1-10KB per portfolio per day (very manageable)
- **Computation**: Daily background jobs needed
- **Granularity**: Daily resolution only (not intraday)
- **Accuracy**: Dependent on snapshot timing

### 📊 **Storage Estimates**

For 1000 active portfolios:

- Daily snapshots: ~10MB/day, ~3.6GB/year
- Transaction snapshots: ~1MB/day average
- Total: <5GB/year for comprehensive tracking

This hybrid approach gives you 90% of the functionality of full historical price storage with less than 5% of the storage requirements. Perfect for a portfolio tracking app that needs good performance analytics without the complexity of a full market data platform.

## API Examples for New Schema

### Transaction Endpoints

```javascript
// POST /portfolios/:id/transactions/deposit
app.post('/portfolios/:id/transactions/deposit', async (req, res) => {
    const { token_id, amount, notes } = req.body;

    try {
        const transaction = await transactionService.processSimpleTransaction({
            portfolio_id: req.params.id,
            token_id,
            amount: Math.abs(amount), // Ensure positive
            transaction_type: 'DEPOSIT',
            cash_flow: -Math.abs(amount), // Money went out of your account
            transaction_date: new Date(),
            notes,
        });

        res.json(transaction);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// POST /portfolios/:id/transactions/swap
app.post('/portfolios/:id/transactions/swap', async (req, res) => {
    const { from_token_id, from_amount, to_token_id, to_amount, notes } = req.body;

    try {
        const result = await transactionService.processTokenSwap({
            portfolio_id: req.params.id,
            from_token_id,
            from_amount: Math.abs(from_amount),
            to_token_id,
            to_amount: Math.abs(to_amount),
            swap_rate: to_amount / from_amount,
            transaction_date: new Date(),
            notes,
        });

        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// GET /portfolios/:id/pnl-analysis
app.get('/portfolios/:id/pnl-analysis', async (req, res) => {
    try {
        const analysis = await pnlAnalysisService.getEnhancedPerformance(req.params.id, req.query.period || '30d');
        res.json(analysis);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
```

## Benefits of This Approach

1. **✅ Database Setup**: Create tables with proper indexes
2. **✅ Snapshot Service**: Implement automated snapshot creation
3. **✅ Background Jobs**: Set up cron schedules for daily/weekly/monthly snapshots
4. **✅ Transaction Integration**: Trigger snapshots on buy/sell transactions
5. **✅ API Endpoints**: Expose performance and historical data
6. **✅ Cleanup Jobs**: Implement data retention policies
7. **✅ Monitoring**: Add logging and alerting for snapshot failures

This design scales well and provides the historical tracking capabilities your users need while keeping complexity and costs manageable.
