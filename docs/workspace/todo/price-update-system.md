# Price Update & Portfolio Snapshot System

**Goal**: Efficiently update token prices and generate portfolio snapshots for all users  
**Strategy**: Deduplicate → Batch → Cache → Snapshot → Distribute  
**Performance**: 400x fewer API calls (400 individual → 1 batch call)

---

## Core Problem

- **20 users** × **2 portfolios** × **20 holdings** = **400 holdings**
- **Unique tokens**: ~100 (due to overlapping holdings)
- **Naive approach**: 400 individual API calls
- **Optimized approach**: 1 batch API call + smart caching

---

## System Architecture

### 1. Token Deduplication

```sql
-- Get all unique tokens across all portfolios
SELECT DISTINCT token_symbol
FROM portfolio_holdings
WHERE deleted_at IS NULL
UNION
SELECT DISTINCT token_symbol
FROM transactions
WHERE deleted_at IS NULL
  AND created_at >= NOW() - INTERVAL '90 days'
```

### 2. Batch API Strategy

```typescript
// CoinGecko batch endpoint - up to 250 tokens per call
async fetchPricesBatch(tokenSymbols: string[]): Promise<TokenPriceData[]> {
  const coinGeckoIds = tokenSymbols.join(',');

  const response = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${coinGeckoIds}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true&include_7d_change=true&include_30d_change=true`
  );

  return response.json();
}
```

### 3. Smart Cache Updates

```sql
-- Bulk upsert to token_price_cache
INSERT INTO token_price_cache (
  token_symbol, price_usd, market_cap, volume_24h,
  price_change_24h, price_change_7d, price_change_30d,
  last_updated, data_source, updated_at
) VALUES (...) -- Batch insert all tokens
ON CONFLICT (token_symbol)
DO UPDATE SET
  price_usd = EXCLUDED.price_usd,
  last_updated = EXCLUDED.last_updated,
  updated_at = EXCLUDED.updated_at;
```

### 4. Portfolio Snapshot Generation

```typescript
async generatePortfolioSnapshots(updatedTokens: string[]) {
  // Get portfolios holding any updated tokens
  const affectedPortfolios = await this.getPortfoliosWithTokens(updatedTokens);

  for (const portfolioId of affectedPortfolios) {
    // Calculate current holdings from transactions
    const holdings = await this.calculateCurrentHoldings(portfolioId);

    // Get fresh prices
    const prices = await this.getCurrentPrices(holdings.map(h => h.tokenSymbol));

    // Calculate portfolio metrics
    const metrics = await this.calculatePortfolioMetrics(holdings, prices);

    // Store snapshot
    await this.storePortfolioSnapshot({
      portfolioId,
      snapshotDate: new Date().toISOString().split('T')[0],
      snapshotTime: new Date().toISOString(),
      snapshotType: 'price_update',
      totalValue: metrics.totalValue,
      totalCostBasis: metrics.totalCostBasis,
      totalPnl: metrics.totalPnl,
      pnlPercentage: metrics.pnlPercentage,
      holdingsCount: holdings.length,
      holdingsData: holdings.map(h => ({
        tokenSymbol: h.tokenSymbol,
        quantity: h.quantity,
        price: prices[h.tokenSymbol].price_usd,
        value: h.quantity * prices[h.tokenSymbol].price_usd,
        costBasis: h.costBasis,
        pnl: (h.quantity * prices[h.tokenSymbol].price_usd) - h.costBasis,
        weight: ((h.quantity * prices[h.tokenSymbol].price_usd) / metrics.totalValue) * 100
      })),
      priceData: prices
    });
  }
}
```

---

## Complete Update Pipeline

```typescript
export class PriceUpdateService {
    async triggerPriceUpdate(type: 'MANUAL' | 'SCHEDULED' | 'USER_TRIGGERED', triggeredBy?: string) {
        const job = await this.createUpdateJob(type, triggeredBy);

        try {
            // 1. Get unique tokens (deduplication)
            const uniqueTokens = await this.getUniqueActiveTokens();

            // 2. Filter tokens that need updates (avoid unnecessary calls)
            const tokensToUpdate = await this.filterStaleTokens(uniqueTokens);

            // 3. Batch API call (1 call for 100 tokens instead of 100 calls)
            const priceData = await this.fetchPricesBatch(tokensToUpdate);

            // 4. Bulk update price cache
            await this.bulkUpdatePriceCache(priceData);

            // 5. Generate portfolio snapshots for affected portfolios
            await this.generatePortfolioSnapshots(tokensToUpdate);

            // 6. Mark job as completed
            await this.completeUpdateJob(job.id, priceData.length);
        } catch (error) {
            await this.failUpdateJob(job.id, error.message);
        }
    }

    // Only update if price is stale (older than 5 minutes)
    async filterStaleTokens(tokens: string[]): Promise<string[]> {
        const recentlyUpdated = await this.db.query(
            `
      SELECT token_symbol 
      FROM token_price_cache 
      WHERE token_symbol = ANY($1) 
        AND last_updated > NOW() - INTERVAL '5 minutes'
    `,
            [tokens],
        );

        const recentSymbols = new Set(recentlyUpdated.map((r) => r.token_symbol));
        return tokens.filter((token) => !recentSymbols.has(token));
    }
}
```

---

## Update Triggers

### Scheduled Updates

```typescript
@Cron('*/5 * * * *') // Every 5 minutes
async scheduledPriceUpdate() {
  await this.priceUpdateService.triggerPriceUpdate('SCHEDULED');
}

@Cron('0 0 * * *') // Daily at midnight
async dailySnapshotUpdate() {
  await this.priceUpdateService.triggerPriceUpdate('SCHEDULED');
  // This will create 'daily' type snapshots
}
```

### User-Triggered Updates

```typescript
async getPortfolioWithPrices(portfolioId: string) {
  const pricesAge = await this.getPricesAge(portfolioId);

  if (pricesAge > 5 * 60 * 1000) { // 5 minutes
    // Trigger background update for this user's tokens
    await this.priceUpdateService.triggerUserTokensUpdate(portfolioId);
  }

  return this.calculatePortfolioWithCurrentPrices(portfolioId);
}
```

### Transaction-Triggered Updates

```typescript
async createTransaction(portfolioId: string, transactionData: any) {
  const transaction = await this.transactionService.create(portfolioId, transactionData);

  // Trigger snapshot after transaction
  await this.priceUpdateService.createTransactionSnapshot(portfolioId);

  return transaction;
}
```

---

## Rate Limiting & Resilience

```typescript
export class CoinGeckoService {
    private rateLimiter = new RateLimiter(50, 60000); // 50 calls per minute

    async fetchPricesBatch(tokens: string[], retryCount = 0): Promise<any> {
        try {
            await this.rateLimiter.waitForToken();

            const response = await fetch(this.buildBatchUrl(tokens), {
                timeout: 10000,
                headers: { 'User-Agent': 'CryptoTracker/1.0' },
            });

            if (response.status === 429) {
                // Rate limited
                if (retryCount < 3) {
                    await this.exponentialBackoff(retryCount);
                    return this.fetchPricesBatch(tokens, retryCount + 1);
                }
                throw new Error('Rate limit exceeded');
            }

            return response.json();
        } catch (error) {
            return this.handleFetchError(tokens, error);
        }
    }

    private async exponentialBackoff(retryCount: number) {
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        await new Promise((resolve) => setTimeout(resolve, delay));
    }
}
```

---

## Performance Benefits

| Metric            | Before (Naive) | After (Optimized)   | Improvement    |
| ----------------- | -------------- | ------------------- | -------------- |
| API Calls         | 400 individual | 1 batch call        | **400x fewer** |
| Response Time     | ~40 seconds    | ~1 second           | **40x faster** |
| Rate Limits       | High risk      | Compliant           | ✅ Safe        |
| Cache Efficiency  | None           | Shared across users | ✅ Optimal     |
| Real-time Updates | Manual only    | Automated           | ✅ Seamless    |

---

## Implementation Phases

### Phase 1: Basic Price Updates

- [ ] Token deduplication logic
- [ ] Batch API integration with CoinGecko
- [ ] Bulk price cache updates
- [ ] Basic job tracking

### Phase 2: Portfolio Snapshots

- [ ] Holdings calculation from transactions
- [ ] Portfolio metrics calculation
- [ ] Snapshot generation after price updates
- [ ] Snapshot type determination

### Phase 3: Smart Scheduling

- [ ] Scheduled price updates (every 5 minutes)
- [ ] User-triggered updates (on portfolio view)
- [ ] Transaction-triggered snapshots
- [ ] Daily snapshot generation

### Phase 4: Resilience & Monitoring

- [ ] Rate limiting and retry logic
- [ ] Fallback API providers
- [ ] Update job monitoring
- [ ] Performance metrics tracking

---

## Success Metrics

- ✅ **API efficiency**: <5 calls per 100 unique tokens
- ✅ **Update frequency**: Every 5 minutes for active portfolios
- ✅ **Response time**: <2 seconds for price updates
- ✅ **Data freshness**: Prices never older than 5 minutes
- ✅ **Snapshot generation**: <1 second per portfolio
- ✅ **System reliability**: 99.9% uptime for price updates

This system scales efficiently from 20 users to 1000+ users while maintaining performance and API compliance.

// FLAG: PENDING VERIFICATION
