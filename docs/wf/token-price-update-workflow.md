# Token Price Update Workflow

**Generated**: 30 May 2025  
**Target**: Token Price Cache Management for Held Assets Only  
**Architecture**: Hexagonal Architecture (Domain-Application-Infrastructure)  
**Update Strategy**: Manual + Daily Auto Updates for Held Tokens Only

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture Design](#architecture-design)
3. [Implementation Plan](#implementation-plan)
4. [API Endpoints](#api-endpoints)
5. [Cron Job Configuration](#cron-job-configuration)
6. [Integration Points](#integration-points)

---

## Overview

This workflow implements a token price update strategy that:

- **Only updates prices for tokens currently held in portfolios** (no waste on unused tokens)
- **Provides manual trigger capability** for immediate price refreshes
- **Auto-updates once or twice daily** (not frequent polling)
- **Follows hexagonal architecture** with proper separation of concerns

### Key Principles

1. **Held-Only Strategy**: Only fetch prices for tokens that exist in portfolio holdings
2. **On-Demand Updates**: Manual triggers for immediate price refreshes
3. **Efficient Scheduling**: Daily/half-daily auto updates, not high-frequency polling
4. **Clean Architecture**: Domain-Application-Infrastructure separation

---

## Architecture Design

### Domain Layer

```
src/core/features/
└── price-update/
    ├── domain/
    │   ├── price-update-job.entity.ts
    │   └── price-update.error.ts
    ├── application/
    │   ├── commands/
    │   │   ├── update-held-token-prices.command.ts
    │   │   └── manual-price-update.command.ts
    │   ├── queries/
    │   │   ├── get-held-tokens.query.ts
    │   │   └── get-price-update-status.query.ts
    │   └── ports/
    │       ├── price-provider.out.port.ts
    │       ├── portfolio-repository.out.port.ts
    │       └── price-update-job.out.port.ts
    └── infrastructure/
        ├── providers/
        │   └── coingecko-price.provider.ts
        ├── repositories/
        │   └── price-update-job.repository.ts
        ├── controllers/
        │   └── price-update.controller.ts
        └── schedulers/
            └── price-update.scheduler.ts
```

### Domain Entities

**`src/core/features/price-update/domain/price-update-job.entity.ts`**

```typescript
export interface IPriceUpdateJob {
    id: string;
    jobType: 'MANUAL' | 'SCHEDULED';
    status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
    tokensToUpdate: string[]; // Token IDs
    tokensUpdated: number;
    totalTokens: number;
    startedAt?: bigint;
    completedAt?: bigint;
    errorMessage?: string;
    triggeredBy?: string; // User ID for manual updates
    createdAt: bigint;
    updatedAt: bigint;
}
```

---

## Implementation Plan

### Application Layer

**`src/core/features/price-update/application/commands/update-held-token-prices.command.ts`**

```typescript
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { PRICE_PROVIDER_OUT_PORT, PriceProviderOutPort } from '../ports/price-provider.out.port';
import { PORTFOLIO_REPOSITORY_OUT_PORT, PortfolioRepositoryOutPort } from '../ports/portfolio-repository.out.port';
import {
    TOKEN_PRICE_REPOSITORY_OUT_PORT,
    TokenPriceRepositoryOutPort,
} from '@modules/asset/application/ports/token-price-repository.out.port';
import { PRICE_UPDATE_JOB_OUT_PORT, PriceUpdateJobOutPort } from '../ports/price-update-job.out.port';
import { TemporalValue } from '@shared/vos/temporal.value';

export class UpdateHeldTokenPricesCommand {
    constructor(
        public readonly jobType: 'MANUAL' | 'SCHEDULED',
        public readonly triggeredBy?: string,
    ) {}
}

@CommandHandler(UpdateHeldTokenPricesCommand)
@Injectable()
export class UpdateHeldTokenPricesHandler implements ICommandHandler<UpdateHeldTokenPricesCommand> {
    constructor(
        @Inject(PRICE_PROVIDER_OUT_PORT)
        private readonly priceProvider: PriceProviderOutPort,
        @Inject(PORTFOLIO_REPOSITORY_OUT_PORT)
        private readonly portfolioRepository: PortfolioRepositoryOutPort,
        @Inject(TOKEN_PRICE_REPOSITORY_OUT_PORT)
        private readonly tokenPriceRepository: TokenPriceRepositoryOutPort,
        @Inject(PRICE_UPDATE_JOB_OUT_PORT)
        private readonly priceUpdateJobRepository: PriceUpdateJobOutPort,
    ) {}

    async execute(command: UpdateHeldTokenPricesCommand): Promise<IPriceUpdateJob> {
        const now = TemporalValue.now;

        // Create job record
        const job = await this.priceUpdateJobRepository.create({
            jobType: command.jobType,
            status: 'PENDING',
            tokensToUpdate: [],
            tokensUpdated: 0,
            totalTokens: 0,
            triggeredBy: command.triggeredBy,
            createdAt: now,
            updatedAt: now,
        });

        try {
            // Get all unique tokens held across all portfolios
            const heldTokens = await this.portfolioRepository.getUniqueHeldTokens();

            if (heldTokens.length === 0) {
                await this.priceUpdateJobRepository.update(job.id, {
                    status: 'COMPLETED',
                    totalTokens: 0,
                    tokensUpdated: 0,
                    completedAt: now,
                    updatedAt: now,
                });
                return job;
            }

            // Update job with tokens to process
            await this.priceUpdateJobRepository.update(job.id, {
                status: 'RUNNING',
                tokensToUpdate: heldTokens.map((t) => t.id),
                totalTokens: heldTokens.length,
                startedAt: now,
                updatedAt: now,
            });

            // Get price data from external provider
            const refIds = heldTokens.map((token) => token.refId).filter(Boolean);
            const priceData = await this.priceProvider.getPricesByRefIds(refIds);

            let updatedCount = 0;

            // Update prices for each held token
            for (const token of heldTokens) {
                if (!token.refId || !priceData[token.refId]) {
                    continue;
                }

                try {
                    const price = priceData[token.refId];
                    await this.tokenPriceRepository.upsert(token.id, {
                        priceUsd: price.priceUsd,
                        marketCap: price.marketCap,
                        volume24h: price.volume24h,
                        priceChange24h: price.priceChange24h,
                        lastUpdated: TemporalValue.now,
                        dataSource: price.dataSource || 'coingecko',
                    });
                    updatedCount++;
                } catch (error) {
                    console.error(`Failed to update price for token ${token.symbol}:`, error);
                }
            }

            // Complete job
            await this.priceUpdateJobRepository.update(job.id, {
                status: 'COMPLETED',
                tokensUpdated: updatedCount,
                completedAt: TemporalValue.now,
                updatedAt: TemporalValue.now,
            });

            return await this.priceUpdateJobRepository.findById(job.id);
        } catch (error) {
            await this.priceUpdateJobRepository.update(job.id, {
                status: 'FAILED',
                errorMessage: error.message,
                completedAt: TemporalValue.now,
                updatedAt: TemporalValue.now,
            });
            throw error;
        }
    }
}
```

**`src/core/features/price-update/application/commands/manual-price-update.command.ts`**

```typescript
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { UpdateHeldTokenPricesCommand, UpdateHeldTokenPricesHandler } from './update-held-token-prices.command';

export class ManualPriceUpdateCommand {
    constructor(public readonly userId: string) {}
}

@CommandHandler(ManualPriceUpdateCommand)
@Injectable()
export class ManualPriceUpdateHandler implements ICommandHandler<ManualPriceUpdateCommand> {
    constructor(private readonly updateHeldTokenPricesHandler: UpdateHeldTokenPricesHandler) {}

    async execute(command: ManualPriceUpdateCommand) {
        const updateCommand = new UpdateHeldTokenPricesCommand('MANUAL', command.userId);
        return await this.updateHeldTokenPricesHandler.execute(updateCommand);
    }
}
```

### Port Interfaces

**`src/core/features/price-update/application/ports/price-provider.out.port.ts`**

```typescript
export interface PriceData {
    priceUsd: number;
    marketCap?: number;
    volume24h?: number;
    priceChange24h?: number;
    dataSource: string;
}

export interface PriceProviderOutPort {
    getPricesByRefIds(refIds: string[]): Promise<Record<string, PriceData>>;
    getPriceByRefId(refId: string): Promise<PriceData | null>;
}

export const PRICE_PROVIDER_OUT_PORT = Symbol('PriceProviderOutPort');
```

**`src/core/features/price-update/application/ports/portfolio-repository.out.port.ts`**

```typescript
import { IToken } from '@modules/asset/domain/token.entity';

export interface PortfolioRepositoryOutPort {
    getUniqueHeldTokens(): Promise<IToken[]>;
}

export const PORTFOLIO_REPOSITORY_OUT_PORT = Symbol('PortfolioRepositoryOutPort');
```

**`src/core/features/price-update/application/ports/price-update-job.out.port.ts`**

```typescript
import { IPriceUpdateJob } from '../../domain/price-update-job.entity';
import { IRepository } from '@core/abstractions/repository.base';

export interface PriceUpdateJobOutPort extends IRepository<IPriceUpdateJob> {
    findRecentJobs(limit?: number): Promise<IPriceUpdateJob[]>;
    findRunningJobs(): Promise<IPriceUpdateJob[]>;
}

export const PRICE_UPDATE_JOB_OUT_PORT = Symbol('PriceUpdateJobOutPort');
```

### Infrastructure Layer

**`src/core/features/price-update/infrastructure/providers/coingecko-price.provider.ts`**

```typescript
import { Injectable } from '@nestjs/common';
import { PriceProviderOutPort, PriceData } from '../../application/ports/price-provider.out.port';

@Injectable()
export class CoinGeckoPriceProvider implements PriceProviderOutPort {
    private readonly baseUrl = 'https://api.coingecko.com/api/v3';

    async getPricesByRefIds(refIds: string[]): Promise<Record<string, PriceData>> {
        if (refIds.length === 0) return {};

        try {
            const idsParam = refIds.join(',');
            const response = await fetch(
                `${this.baseUrl}/simple/price?ids=${idsParam}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true`,
            );

            if (!response.ok) {
                throw new Error(`CoinGecko API error: ${response.status}`);
            }

            const data = await response.json();
            const result: Record<string, PriceData> = {};

            for (const [refId, priceInfo] of Object.entries(data)) {
                const info = priceInfo as any;
                result[refId] = {
                    priceUsd: info.usd || 0,
                    marketCap: info.usd_market_cap,
                    volume24h: info.usd_24h_vol,
                    priceChange24h: info.usd_24h_change,
                    dataSource: 'coingecko',
                };
            }

            return result;
        } catch (error) {
            console.error('Failed to fetch prices from CoinGecko:', error);
            return {};
        }
    }

    async getPriceByRefId(refId: string): Promise<PriceData | null> {
        const prices = await this.getPricesByRefIds([refId]);
        return prices[refId] || null;
    }
}
```

**`src/core/features/price-update/infrastructure/repositories/portfolio.repository.adapter.ts`**

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PortfolioRepositoryOutPort } from '../../application/ports/portfolio-repository.out.port';
import { PortfolioHoldingEntity } from '@modules/portfolio/infrastructure/persistence/portfolio-holding.persistence';
import { TokenEntity } from '@modules/asset/infrastructure/persistence/token.persistence';
import { IToken } from '@modules/asset/domain/token.entity';

@Injectable()
export class PortfolioRepositoryAdapter implements PortfolioRepositoryOutPort {
    constructor(
        @InjectRepository(PortfolioHoldingEntity)
        private readonly holdingRepository: Repository<PortfolioHoldingEntity>,
    ) {}

    async getUniqueHeldTokens(): Promise<IToken[]> {
        const results = await this.holdingRepository
            .createQueryBuilder('holding')
            .innerJoin('tokens', 'token', 'token.id = holding.token_id')
            .select([
                'token.id as id',
                'token.symbol as symbol',
                'token.name as name',
                'token.ref_id as refId',
                'token.decimals as decimals',
                'token.is_active as isActive',
                'token.is_stablecoin as isStablecoin',
                'token.stablecoin_peg as stablecoinPeg',
                'token.logo_url as logoUrl',
                'token.created_at as createdAt',
                'token.created_by_id as createdById',
                'token.updated_at as updatedAt',
                'token.updated_by_id as updatedById',
                'token.deleted_at as deletedAt',
                'token.deleted_by_id as deletedById',
            ])
            .where('holding.quantity > 0')
            .andWhere('token.deleted_at IS NULL')
            .andWhere('token.is_active = true')
            .groupBy('token.id')
            .getRawMany();

        return results.map((row) => ({
            id: row.id,
            symbol: row.symbol,
            name: row.name,
            refId: row.refId,
            decimals: row.decimals,
            isActive: row.isActive,
            isStablecoin: row.isStablecoin,
            stablecoinPeg: row.stablecoinPeg,
            logoUrl: row.logoUrl,
            createdAt: row.createdAt,
            createdById: row.createdById,
            updatedAt: row.updatedAt,
            updatedById: row.updatedById,
            deletedAt: row.deletedAt,
            deletedById: row.deletedById,
        }));
    }
}
```

**`src/core/features/price-update/infrastructure/schedulers/price-update.scheduler.ts`**

```typescript
import { Injectable } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UpdateHeldTokenPricesCommand } from '../../application/commands/update-held-token-prices.command';

@Injectable()
export class PriceUpdateScheduler {
    constructor(private readonly commandBus: CommandBus) {}

    // Daily at 6:00 AM UTC
    @Cron('0 6 * * *')
    async handleDailyPriceUpdate() {
        console.log('Running scheduled daily price update for held tokens...');
        try {
            await this.commandBus.execute(new UpdateHeldTokenPricesCommand('SCHEDULED'));
            console.log('Daily price update completed successfully');
        } catch (error) {
            console.error('Daily price update failed:', error);
        }
    }

    // Half-day update at 6:00 PM UTC (optional)
    @Cron('0 18 * * *')
    async handleHalfDayPriceUpdate() {
        console.log('Running scheduled half-day price update for held tokens...');
        try {
            await this.commandBus.execute(new UpdateHeldTokenPricesCommand('SCHEDULED'));
            console.log('Half-day price update completed successfully');
        } catch (error) {
            console.error('Half-day price update failed:', error);
        }
    }
}
```

---

## API Endpoints

**`src/core/features/price-update/infrastructure/controllers/price-update.controller.ts`**

```typescript
import { Controller, Post, Get, UseGuards, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@modules/auth/infrastructure/jwt-auth.guard';
import { GetUser } from '@core/decorators/get-user.decorator';
import { IUser } from '@modules/user/domain/user.entity';
import { ManualPriceUpdateCommand } from '../../application/commands/manual-price-update.command';
import { GetPriceUpdateStatusQuery } from '../../application/queries/get-price-update-status.query';

@ApiTags('Price Updates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin/price-updates')
export class PriceUpdateController {
    constructor(
        private readonly commandBus: CommandBus,
        private readonly queryBus: QueryBus,
    ) {}

    @Post('manual')
    @ApiOperation({ summary: 'Trigger manual price update for held tokens' })
    @ApiResponse({ status: 200, description: 'Price update job started' })
    async triggerManualUpdate(@GetUser() user: IUser) {
        return this.commandBus.execute(new ManualPriceUpdateCommand(user.id));
    }

    @Get('status')
    @ApiOperation({ summary: 'Get price update job status' })
    @ApiResponse({ status: 200, description: 'Price update status retrieved' })
    async getUpdateStatus(@Query('limit') limit = 10) {
        return this.queryBus.execute(new GetPriceUpdateStatusQuery(limit));
    }
}
```

---

## Cron Job Configuration

### Schedule Options

**Option 1: Daily Only**

```typescript
// Daily at 6:00 AM UTC
@Cron('0 6 * * *')
```

**Option 2: Twice Daily**

```typescript
// 6:00 AM UTC
@Cron('0 6 * * *')
// 6:00 PM UTC
@Cron('0 18 * * *')
```

**Option 3: Custom Intervals**

```typescript
// Every 12 hours
@Cron('0 */12 * * *')
```

---

## Integration Points

### Module Assembly

**`src/core/features/price-update/price-update.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { PriceUpdateJobEntity } from './infrastructure/persistence/price-update-job.persistence';
import { PortfolioHoldingEntity } from '@modules/portfolio/infrastructure/persistence/portfolio-holding.persistence';

// Providers
import { CoinGeckoPriceProvider } from './infrastructure/providers/coingecko-price.provider';
import { PortfolioRepositoryAdapter } from './infrastructure/repositories/portfolio.repository.adapter';
import { PriceUpdateJobRepository } from './infrastructure/repositories/price-update-job.repository';

// Commands
import { UpdateHeldTokenPricesHandler } from './application/commands/update-held-token-prices.command';
import { ManualPriceUpdateHandler } from './application/commands/manual-price-update.command';

// Queries
import { GetPriceUpdateStatusHandler } from './application/queries/get-price-update-status.query';

// Controllers & Schedulers
import { PriceUpdateController } from './infrastructure/controllers/price-update.controller';
import { PriceUpdateScheduler } from './infrastructure/schedulers/price-update.scheduler';

// Ports
import { PRICE_PROVIDER_OUT_PORT } from './application/ports/price-provider.out.port';
import { PORTFOLIO_REPOSITORY_OUT_PORT } from './application/ports/portfolio-repository.out.port';
import { PRICE_UPDATE_JOB_OUT_PORT } from './application/ports/price-update-job.out.port';

const CommandHandlers = [UpdateHeldTokenPricesHandler, ManualPriceUpdateHandler];
const QueryHandlers = [GetPriceUpdateStatusHandler];

@Module({
    imports: [TypeOrmModule.forFeature([PriceUpdateJobEntity, PortfolioHoldingEntity]), CqrsModule],
    controllers: [PriceUpdateController],
    providers: [
        // Schedulers
        PriceUpdateScheduler,

        // Providers
        {
            provide: PRICE_PROVIDER_OUT_PORT,
            useClass: CoinGeckoPriceProvider,
        },
        {
            provide: PORTFOLIO_REPOSITORY_OUT_PORT,
            useClass: PortfolioRepositoryAdapter,
        },
        {
            provide: PRICE_UPDATE_JOB_OUT_PORT,
            useClass: PriceUpdateJobRepository,
        },

        // Handlers
        ...CommandHandlers,
        ...QueryHandlers,
    ],
    exports: [PRICE_PROVIDER_OUT_PORT],
})
export class PriceUpdateModule {}
```

---

## Benefits of This Approach

1. **✅ Efficient**: Only updates prices for tokens actually held in portfolios
2. **✅ Manual Control**: API endpoint for immediate price refresh
3. **✅ Low Frequency**: Daily/half-daily updates, not resource-intensive
4. **✅ Clean Architecture**: Proper hexagonal architecture separation
5. **✅ Job Tracking**: Full audit trail of price update jobs
6. **✅ Error Handling**: Graceful failure handling with job status tracking
7. **✅ Extensible**: Easy to add new price providers or update frequencies

---

**Last Updated**: 30 May 2025  
**Integration**: Add to main app.module.ts and ensure ScheduleModule is imported
