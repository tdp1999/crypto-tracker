# Asset Module Development Workflow Plan

**Generated**: 30 May 2025  
**Based on**: `docs/wf/transaction-plan.md` and existing project conventions  
**Target**: Complete Asset Management Module (Phase 2)  
**Estimated Timeline**: 2-3 weeks

---

## Table of Contents

1. [Overview](#overview)
2. [Entity Structure & Relationships](#entity-structure--relationships)
3. [Implementation Checkpoints](#implementation-checkpoints)
    - [Checkpoint 1: Domain Layer](#checkpoint-1-domain-layer-days-1-2)
    - [Checkpoint 2: Persistence Layer](#checkpoint-2-persistence-layer-days-3-4)
    - [Checkpoint 3: API Layer](#checkpoint-3-api-layer-days-5-6)
    - [Checkpoint 4: Integration & Testing](#checkpoint-4-integration--testing-days-7-8)
4. [API Endpoints Summary](#api-endpoints-summary)
5. [Success Criteria](#success-criteria)
6. [Dependencies](#dependencies)

---

## Overview

The Asset Module serves as the core data management layer for tokens, portfolio holdings, and price cache. This module bridges the gap between external token data (ProviderModule) and portfolio tracking, enabling real-time portfolio valuation and performance analysis.

### Key Components

1. **Token Management** - Master token data storage with external API references
2. **Portfolio Holdings** - Current token positions per portfolio with cost basis tracking
3. **Token Price Cache** - Hot cache for current market prices

### Architecture Principles

- **Hexagonal Architecture** - Clean separation between domain, application, and infrastructure layers
- **CQRS Pattern** - Separate commands and queries for better scalability
- **No Foreign Keys** - Reference IDs only, with TypeORM relations for modeling
- **Zod Validation** - Type-safe input validation for all endpoints

---

## Entity Structure & Relationships

The Asset Module uses TypeORM entities without foreign key constraints, following hexagonal architecture principles where only reference IDs are stored. TypeORM relation decorators (@OneToMany, @ManyToOne) are used for modeling purposes to clarify relationships.

### Entity Overview

```
Token (Master Data)
├── TokenPrice (Hot Cache) - 1:1 current price
└── PortfolioHolding (Positions) - 1:many holdings per token
```

### Sample Entity Reference

```typescript
@Entity('tokens')
@Index(['symbol'])
@Index(['refId'])
@Index(['isActive'])
export class TokenEntity extends BasePersistence implements IToken {
    @Column({ length: 20, unique: true })
    symbol: string;

    @Column({ length: 100 })
    name: string;

    @Column({ name: 'ref_id', length: 100 })
    refId: string; // Required for external API integration

    @Column({ default: 18 })
    decimals: number;

    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    @Column({ name: 'is_stablecoin', default: false })
    isStablecoin: boolean;

    @Column({ name: 'stablecoin_peg', length: 10, nullable: true })
    stablecoinPeg?: string;

    @Column({ name: 'logo_url', type: 'text', nullable: true })
    logoUrl?: string;

    // Relations for modeling (no foreign keys in DB)
    @OneToMany(() => PortfolioHoldingEntity, (holding) => holding.token, { cascade: false })
    holdings: PortfolioHoldingEntity[];

    @OneToMany(() => TokenPriceEntity, (price) => price.token, { cascade: false })
    prices: TokenPriceEntity[];
}
```

### Entity Relationships

1. **Token Entity** - Stores master token information with required `refId` for external API integration
2. **Token Price Entity** - Cache for current market prices linked by `tokenId` reference
3. **Portfolio Holdings Entity** - Current state of tokens held in each portfolio, linked by `portfolioId` and `tokenId` references

---

## Implementation Checkpoints

### Checkpoint 1: Domain Layer (Days 1-2)

**Objective**: Establish core business logic, domain interfaces, and data validation schemas.

#### 1.1 Folder Structure Setup

```bash
src/modules/asset/
├── asset.module.ts
├── domain/
│   ├── token.entity.ts
│   ├── portfolio-holding.entity.ts
│   ├── token-price.entity.ts
│   └── asset.error.ts
├── application/
│   ├── asset.dto.ts
│   ├── commands/
│   │   ├── create-token.command.ts
│   │   ├── update-token-price.command.ts
│   │   ├── create-portfolio-holding.command.ts
│   │   ├── update-portfolio-holding.command.ts
│   │   └── delete-portfolio-holding.command.ts
│   ├── queries/
│   │   ├── get-token.query.ts
│   │   ├── get-token-price.query.ts
│   │   ├── get-portfolio-holdings.query.ts
│   │   └── get-portfolio-value.query.ts
│   └── ports/
│       ├── token-repository.out.port.ts
│       ├── portfolio-holding-repository.out.port.ts
│       └── token-price-repository.out.port.ts
└── infrastructure/
    ├── persistence/
    │   ├── token.persistence.ts
    │   ├── token.repository.ts
    │   ├── portfolio-holding.persistence.ts
    │   ├── portfolio-holding.repository.ts
    │   ├── token-price.persistence.ts
    │   └── token-price.repository.ts
    ├── controller/
    │   └── asset.controller.ts
    └── rpc/
        └── asset.rpc.ts
```

#### 1.2 Domain Interfaces

**`src/modules/asset/domain/token.entity.ts`**

```typescript
export interface IToken {
    id: string;
    symbol: string;
    name: string;
    refId: string; // required - external API reference
    decimals: number;
    isActive: boolean;
    isStablecoin: boolean;
    stablecoinPeg?: string;
    logoUrl?: string;
    createdAt: bigint;
    createdById: string;
    updatedAt: bigint;
    updatedById: string;
    deletedAt?: bigint;
    deletedById?: string;
}
```

**`src/modules/asset/domain/portfolio-holding.entity.ts`**

```typescript
export interface IPortfolioHolding {
    id: string;
    portfolioId: string;
    tokenId: string;
    quantity: number;
    averageBuyPrice: number;
    totalCostBasis: number;
    firstPurchaseDate?: bigint;
    lastTransactionDate?: bigint;
    createdAt: bigint;
    createdById: string;
    updatedAt: bigint;
    updatedById: string;
    deletedAt?: bigint;
    deletedById?: string;
}
```

**`src/modules/asset/domain/token-price.entity.ts`**

```typescript
export interface ITokenPrice {
    tokenId: string;
    priceUsd: number;
    marketCap?: number;
    volume24h?: number;
    priceChange24h?: number;
    lastUpdated: bigint;
    dataSource: string;
    createdAt: bigint;
    updatedAt: bigint;
}
```

#### 1.3 Zod Validation Schemas

**`src/modules/asset/application/asset.dto.ts`**

```typescript
import { z } from 'zod';

export const CreateTokenSchema = z.object({
    symbol: z.string().max(20).min(1),
    name: z.string().max(100).min(1),
    refId: z.string().min(1), // required
    decimals: z.number().int().min(0).max(18).default(18),
    isStablecoin: z.boolean().default(false),
    stablecoinPeg: z.string().optional(),
    logoUrl: z.string().url().optional(),
});

export const CreatePortfolioHoldingSchema = z.object({
    portfolioId: z.string().uuid(),
    tokenId: z.string().uuid(),
    quantity: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
        message: 'Quantity must be a positive number',
    }),
    averageBuyPrice: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
        message: 'Average buy price must be a positive number',
    }),
    totalCostBasis: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
        message: 'Total cost basis must be a positive number',
    }),
});

export type CreateTokenDto = z.infer<typeof CreateTokenSchema>;
export type CreatePortfolioHoldingDto = z.infer<typeof CreatePortfolioHoldingSchema>;
```

#### 1.4 Port Interfaces

**`src/modules/asset/application/ports/token-repository.out.port.ts`**

```typescript
import { IToken } from '@modules/asset/domain/token.entity';

export interface TokenRepositoryOutPort {
    findBySymbol(symbol: string): Promise<IToken | null>;
    findByRefId(refId: string): Promise<IToken | null>;
    findActiveTokens(): Promise<IToken[]>;
    create(token: Partial<IToken>): Promise<IToken>;
    update(id: string, updates: Partial<IToken>): Promise<IToken>;
    findById(id: string): Promise<IToken | null>;
    searchByName(query: string, limit?: number): Promise<IToken[]>;
}
```

#### 1.5 Command & Query Skeletons

**`src/modules/asset/application/commands/create-token.command.ts`**

```typescript
import { CreateTokenDto } from '@modules/asset/application/asset.dto';

export class CreateTokenCommand {
    constructor(
        public readonly createTokenDto: CreateTokenDto,
        public readonly userId: string,
    ) {}
}

export class CreateTokenHandler {
    // Full implementation in Checkpoint 2
}
```

**Checkpoint 1 Deliverables:**

- ✅ Domain interfaces defined
- ✅ Zod validation schemas created
- ✅ Port interfaces defined
- ✅ Command/Query skeletons created
- ✅ Module folder structure established

---

### Checkpoint 2: Persistence Layer (Days 3-4)

**Objective**: Create TypeORM entities with proper decorators and relationships, implement persistence logic, and connect ports with adapters.

#### 2.1 TypeORM Entities

**`src/modules/asset/infrastructure/persistence/token.persistence.ts`**

```typescript
import { BasePersistence } from '@core/abstractions/persistence.base';
import { IToken } from '@modules/asset/domain/token.entity';
import { Column, Entity, Index, OneToMany } from 'typeorm';
import { PortfolioHoldingEntity } from './portfolio-holding.persistence';
import { TokenPriceEntity } from './token-price.persistence';

@Entity('tokens')
@Index(['symbol'])
@Index(['refId'])
@Index(['isActive'])
export class TokenEntity extends BasePersistence implements IToken {
    @Column({ length: 20, unique: true })
    symbol: string;

    @Column({ length: 100 })
    name: string;

    @Column({ name: 'ref_id', length: 100 })
    refId: string;

    @Column({ default: 18 })
    decimals: number;

    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    @Column({ name: 'is_stablecoin', default: false })
    isStablecoin: boolean;

    @Column({ name: 'stablecoin_peg', length: 10, nullable: true })
    stablecoinPeg?: string;

    @Column({ name: 'logo_url', type: 'text', nullable: true })
    logoUrl?: string;

    // Relations for modeling purposes (no foreign keys in DB)
    @OneToMany(() => PortfolioHoldingEntity, (holding) => holding.token, { cascade: false })
    holdings: PortfolioHoldingEntity[];

    @OneToMany(() => TokenPriceEntity, (price) => price.token, { cascade: false })
    prices: TokenPriceEntity[];
}
```

**`src/modules/asset/infrastructure/persistence/portfolio-holding.persistence.ts`**

```typescript
import { BasePersistence } from '@core/abstractions/persistence.base';
import { IPortfolioHolding } from '@modules/asset/domain/portfolio-holding.entity';
import { Column, Entity, Index, ManyToOne, JoinColumn } from 'typeorm';
import { TokenEntity } from './token.persistence';

@Entity('portfolio_holdings')
@Index(['portfolioId'])
@Index(['tokenId'])
@Index(['lastTransactionDate'])
@Index(['portfolioId', 'tokenId'], { unique: true })
export class PortfolioHoldingEntity extends BasePersistence implements IPortfolioHolding {
    @Column({ name: 'portfolio_id' })
    portfolioId: string;

    @Column({ name: 'token_id' })
    tokenId: string;

    @Column({ type: 'decimal', precision: 20, scale: 8 })
    quantity: number;

    @Column({ name: 'average_buy_price', type: 'decimal', precision: 20, scale: 8 })
    averageBuyPrice: number;

    @Column({ name: 'total_cost_basis', type: 'decimal', precision: 20, scale: 8 })
    totalCostBasis: number;

    @Column({ name: 'first_purchase_date', type: 'bigint', nullable: true })
    firstPurchaseDate?: bigint;

    @Column({ name: 'last_transaction_date', type: 'bigint', nullable: true })
    lastTransactionDate?: bigint;

    // Relations for modeling purposes (no foreign keys in DB)
    @ManyToOne(() => TokenEntity, (token) => token.holdings)
    @JoinColumn({ name: 'token_id' })
    token: TokenEntity;
}
```

**`src/modules/asset/infrastructure/persistence/token-price.persistence.ts`**

```typescript
import { ITokenPrice } from '@modules/asset/domain/token-price.entity';
import { Column, Entity, Index, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { TokenEntity } from './token.persistence';

@Entity('token_prices_current')
@Index(['lastUpdated'])
@Index(['dataSource'])
export class TokenPriceEntity implements ITokenPrice {
    @PrimaryColumn({ name: 'token_id' })
    tokenId: string;

    @Column({ name: 'price_usd', type: 'decimal', precision: 20, scale: 8 })
    priceUsd: number;

    @Column({ name: 'market_cap', type: 'decimal', precision: 20, scale: 2, nullable: true })
    marketCap?: number;

    @Column({ name: 'volume_24h', type: 'decimal', precision: 20, scale: 2, nullable: true })
    volume24h?: number;

    @Column({ name: 'price_change_24h', type: 'decimal', precision: 10, scale: 4, nullable: true })
    priceChange24h?: number;

    @Column({ name: 'last_updated', type: 'bigint' })
    lastUpdated: bigint;

    @Column({ name: 'data_source', length: 50, default: 'coingecko' })
    dataSource: string;

    @Column({ name: 'created_at', type: 'bigint' })
    createdAt: bigint;

    @Column({ name: 'updated_at', type: 'bigint' })
    updatedAt: bigint;

    // Relations for modeling purposes (no foreign keys in DB)
    @ManyToOne(() => TokenEntity, (token) => token.prices)
    @JoinColumn({ name: 'token_id' })
    token: TokenEntity;
}
```

#### 2.2 Repository Implementations

**`src/modules/asset/infrastructure/persistence/token.repository.ts`**

```typescript
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { TokenRepositoryOutPort } from '@modules/asset/application/ports/token-repository.out.port';
import { TokenEntity } from './token.persistence';
import { IToken } from '@modules/asset/domain/token.entity';

@Injectable()
export class TokenRepository implements TokenRepositoryOutPort {
    constructor(
        @InjectRepository(TokenEntity)
        private readonly tokenRepository: Repository<TokenEntity>,
    ) {}

    async findBySymbol(symbol: string): Promise<IToken | null> {
        return this.tokenRepository.findOne({
            where: { symbol: symbol.toUpperCase(), deletedAt: null },
        });
    }

    async findByRefId(refId: string): Promise<IToken | null> {
        return this.tokenRepository.findOne({
            where: { refId, deletedAt: null },
        });
    }

    async findActiveTokens(): Promise<IToken[]> {
        return this.tokenRepository.find({
            where: { isActive: true, deletedAt: null },
            order: { symbol: 'ASC' },
        });
    }

    async create(token: Partial<IToken>): Promise<IToken> {
        const entity = this.tokenRepository.create(token);
        return this.tokenRepository.save(entity);
    }

    async update(id: string, updates: Partial<IToken>): Promise<IToken> {
        await this.tokenRepository.update(id, updates);
        const updated = await this.findById(id);
        if (!updated) {
            throw new Error(`Token with id ${id} not found`);
        }
        return updated;
    }

    async findById(id: string): Promise<IToken | null> {
        return this.tokenRepository.findOne({
            where: { id, deletedAt: null },
        });
    }

    async searchByName(query: string, limit = 10): Promise<IToken[]> {
        return this.tokenRepository
            .createQueryBuilder('token')
            .where('token.deletedAt IS NULL')
            .andWhere('token.isActive = true')
            .andWhere('(LOWER(token.name) LIKE LOWER(:query) OR LOWER(token.symbol) LIKE LOWER(:query))', {
                query: `%${query}%`,
            })
            .orderBy('token.symbol', 'ASC')
            .limit(limit)
            .getMany();
    }
}
```

**Checkpoint 2 Deliverables:**

- ✅ TypeORM entities with relation decorators created
- ✅ Repository implementations completed
- ✅ Port-adapter pattern established
- ✅ Database schema ready for migration generation

---

### Checkpoint 3: API Layer (Days 5-6)

**Objective**: Create HTTP API endpoints, RPC handlers, and input validation using Zod schemas.

#### 3.1 Command & Query Handlers

**`src/modules/asset/application/commands/create-token.command.ts`**

```typescript
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { TokenRepositoryOutPort } from '@modules/asset/application/ports/token-repository.out.port';
import { CreateTokenDto } from '@modules/asset/application/asset.dto';
import { IToken } from '@modules/asset/domain/token.entity';
import { TemporalValue } from '@shared/vos/temporal.value';
import { ConflictException } from '@nestjs/common';

export class CreateTokenCommand {
    constructor(
        public readonly createTokenDto: CreateTokenDto,
        public readonly userId: string,
    ) {}
}

@CommandHandler(CreateTokenCommand)
export class CreateTokenHandler implements ICommandHandler<CreateTokenCommand> {
    constructor(private readonly tokenRepository: TokenRepositoryOutPort) {}

    async execute(command: CreateTokenCommand): Promise<IToken> {
        const { createTokenDto, userId } = command;

        // Check if token with symbol already exists
        const existingToken = await this.tokenRepository.findBySymbol(createTokenDto.symbol);
        if (existingToken) {
            throw new ConflictException(`Token with symbol ${createTokenDto.symbol} already exists`);
        }

        const now = TemporalValue.now;
        const token = await this.tokenRepository.create({
            symbol: createTokenDto.symbol.toUpperCase(),
            name: createTokenDto.name,
            refId: createTokenDto.refId,
            decimals: createTokenDto.decimals ?? 18,
            isActive: true,
            isStablecoin: createTokenDto.isStablecoin ?? false,
            stablecoinPeg: createTokenDto.stablecoinPeg,
            logoUrl: createTokenDto.logoUrl,
            createdAt: now,
            createdById: userId,
            updatedAt: now,
            updatedById: userId,
        });

        return token;
    }
}
```

#### 3.2 HTTP Controller

**`src/modules/asset/infrastructure/controller/asset.controller.ts`**

```typescript
import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards, UsePipes } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@modules/auth/infrastructure/jwt-auth.guard';
import { GetUser } from '@core/decorators/get-user.decorator';
import { IUser } from '@modules/user/domain/user.entity';
import { ZodValidationPipe } from '@core/pipes/zod-validation.pipe';
import { CreateTokenCommand } from '@modules/asset/application/commands/create-token.command';
import { CreatePortfolioHoldingCommand } from '@modules/asset/application/commands/create-portfolio-holding.command';
import { GetPortfolioHoldingsQuery } from '@modules/asset/application/queries/get-portfolio-holdings.query';
import {
    CreateTokenDto,
    CreateTokenSchema,
    CreatePortfolioHoldingDto,
    CreatePortfolioHoldingSchema,
    TokenResponseDto,
    PortfolioValueResponseDto,
} from '@modules/asset/application/asset.dto';

@ApiTags('Assets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('assets')
export class AssetController {
    constructor(
        private readonly commandBus: CommandBus,
        private readonly queryBus: QueryBus,
    ) {}

    @Post('tokens')
    @ApiOperation({ summary: 'Create a new token' })
    @ApiResponse({ status: 201, description: 'Token created successfully', type: TokenResponseDto })
    @UsePipes(new ZodValidationPipe(CreateTokenSchema))
    async createToken(@Body() createTokenDto: CreateTokenDto, @GetUser() user: IUser): Promise<TokenResponseDto> {
        return this.commandBus.execute(new CreateTokenCommand(createTokenDto, user.id));
    }

    @Post('portfolios/:portfolioId/holdings')
    @ApiOperation({ summary: 'Add or update portfolio token holding' })
    @ApiResponse({ status: 201, description: 'Portfolio holding created/updated successfully' })
    @UsePipes(new ZodValidationPipe(CreatePortfolioHoldingSchema))
    async createPortfolioHolding(
        @Param('portfolioId') portfolioId: string,
        @Body() createHoldingDto: CreatePortfolioHoldingDto,
        @GetUser() user: IUser,
    ) {
        return this.commandBus.execute(
            new CreatePortfolioHoldingCommand({ ...createHoldingDto, portfolioId }, user.id),
        );
    }

    @Get('portfolios/:portfolioId/holdings')
    @ApiOperation({ summary: 'Get portfolio holdings with current values' })
    @ApiResponse({
        status: 200,
        description: 'Portfolio holdings retrieved successfully',
        type: PortfolioValueResponseDto,
    })
    async getPortfolioHoldings(
        @Param('portfolioId') portfolioId: string,
        @GetUser() user: IUser,
    ): Promise<PortfolioValueResponseDto> {
        return this.queryBus.execute(new GetPortfolioHoldingsQuery(portfolioId, user.id));
    }

    @Delete('portfolios/:portfolioId/holdings/:tokenId')
    @ApiOperation({ summary: 'Remove holding from portfolio' })
    @ApiResponse({ status: 200, description: 'Holding removed successfully' })
    async removePortfolioHolding(
        @Param('portfolioId') portfolioId: string,
        @Param('tokenId') tokenId: string,
        @GetUser() user: IUser,
    ) {
        return this.commandBus.execute(new DeletePortfolioHoldingCommand(portfolioId, tokenId, user.id));
    }
}
```

#### 3.3 RPC Handler

**`src/modules/asset/infrastructure/rpc/asset.rpc.ts`**

```typescript
import { Controller } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { UpdateTokenPriceCommand } from '@modules/asset/application/commands/update-token-price.command';
import { GetTokenQuery } from '@modules/asset/application/queries/get-token.query';

@Controller()
export class AssetRpcController {
    constructor(
        private readonly commandBus: CommandBus,
        private readonly queryBus: QueryBus,
    ) {}

    @MessagePattern('token.get')
    async getToken(@Payload() data: { tokenId: string }) {
        return this.queryBus.execute(new GetTokenQuery(data.tokenId));
    }

    @EventPattern('price.updated')
    async handlePriceUpdate(@Payload() data: { tokenId: string; priceData: any }) {
        await this.commandBus.execute(new UpdateTokenPriceCommand(data.tokenId, data.priceData));
    }
}
```

#### 3.4 Module Assembly

**`src/modules/asset/asset.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';

// Entities
import { TokenEntity } from './infrastructure/persistence/token.persistence';
import { PortfolioHoldingEntity } from './infrastructure/persistence/portfolio-holding.persistence';
import { TokenPriceEntity } from './infrastructure/persistence/token-price.persistence';

// Repositories
import { TokenRepository } from './infrastructure/persistence/token.repository';
import { PortfolioHoldingRepository } from './infrastructure/persistence/portfolio-holding.repository';
import { TokenPriceRepository } from './infrastructure/persistence/token-price.repository';

// Ports
import { TokenRepositoryOutPort } from './application/ports/token-repository.out.port';
import { PortfolioHoldingRepositoryOutPort } from './application/ports/portfolio-holding-repository.out.port';
import { TokenPriceRepositoryOutPort } from './application/ports/token-price-repository.out.port';

// Commands
import { CreateTokenHandler } from './application/commands/create-token.command';
import { UpdateTokenPriceHandler } from './application/commands/update-token-price.command';
import { CreatePortfolioHoldingHandler } from './application/commands/create-portfolio-holding.command';
import { UpdatePortfolioHoldingHandler } from './application/commands/update-portfolio-holding.command';
import { DeletePortfolioHoldingHandler } from './application/commands/delete-portfolio-holding.command';

// Queries
import { GetTokenHandler } from './application/queries/get-token.query';
import { GetTokenPriceHandler } from './application/queries/get-token-price.query';
import { GetPortfolioHoldingsHandler } from './application/queries/get-portfolio-holdings.query';
import { GetPortfolioValueHandler } from './application/queries/get-portfolio-value.query';

// Controllers
import { AssetController } from './infrastructure/controller/asset.controller';
import { AssetRpcController } from './infrastructure/rpc/asset.rpc';

const CommandHandlers = [
    CreateTokenHandler,
    UpdateTokenPriceHandler,
    CreatePortfolioHoldingHandler,
    UpdatePortfolioHoldingHandler,
    DeletePortfolioHoldingHandler,
];

const QueryHandlers = [GetTokenHandler, GetTokenPriceHandler, GetPortfolioHoldingsHandler, GetPortfolioValueHandler];

@Module({
    imports: [TypeOrmModule.forFeature([TokenEntity, PortfolioHoldingEntity, TokenPriceEntity]), CqrsModule],
    controllers: [AssetController, AssetRpcController],
    providers: [
        // Repositories
        {
            provide: TokenRepositoryOutPort,
            useClass: TokenRepository,
        },
        {
            provide: PortfolioHoldingRepositoryOutPort,
            useClass: PortfolioHoldingRepository,
        },
        {
            provide: TokenPriceRepositoryOutPort,
            useClass: TokenPriceRepository,
        },
        // Handlers
        ...CommandHandlers,
        ...QueryHandlers,
    ],
    exports: [TokenRepositoryOutPort, PortfolioHoldingRepositoryOutPort, TokenPriceRepositoryOutPort],
})
export class AssetModule {}
```

**Checkpoint 3 Deliverables:**

- ✅ HTTP API endpoints with Zod validation
- ✅ RPC handlers for inter-service communication
- ✅ Complete module assembly
- ✅ Route definitions and input validation

---

### Checkpoint 4: Integration & Testing (Days 7-8)

**Objective**: Integrate with existing modules, implement comprehensive testing, and ensure production readiness.

#### 4.1 Integration with Existing Modules

Update **`src/app.module.ts`** to include the AssetModule:

```typescript
import { Module } from '@nestjs/common';
import { AssetModule } from '@modules/asset/asset.module';

@Module({
    imports: [
        // ... existing modules
        AssetModule,
    ],
    // ...
})
export class AppModule {}
```

#### 4.2 Unit Tests

**`src/modules/asset/__tests__/create-token.command.spec.ts`**

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { CreateTokenHandler, CreateTokenCommand } from '@modules/asset/application/commands/create-token.command';
import { TokenRepositoryOutPort } from '@modules/asset/application/ports/token-repository.out.port';
import { CreateTokenDto } from '@modules/asset/application/asset.dto';
import { IToken } from '@modules/asset/domain/token.entity';

describe('CreateTokenHandler', () => {
    let handler: CreateTokenHandler;
    let tokenRepository: jest.Mocked<TokenRepositoryOutPort>;

    beforeEach(async () => {
        const mockTokenRepository = {
            findBySymbol: jest.fn(),
            create: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CreateTokenHandler,
                {
                    provide: TokenRepositoryOutPort,
                    useValue: mockTokenRepository,
                },
            ],
        }).compile();

        handler = module.get<CreateTokenHandler>(CreateTokenHandler);
        tokenRepository = module.get(TokenRepositoryOutPort);
    });

    it('should create a token successfully', async () => {
        // Arrange
        const createTokenDto: CreateTokenDto = {
            symbol: 'BTC',
            name: 'Bitcoin',
            refId: 'bitcoin',
            decimals: 8,
            isStablecoin: false,
        };
        const userId = 'user-123';
        const command = new CreateTokenCommand(createTokenDto, userId);

        tokenRepository.findBySymbol.mockResolvedValue(null);
        const expectedToken: IToken = {
            id: 'token-123',
            symbol: 'BTC',
            name: 'Bitcoin',
            refId: 'bitcoin',
            decimals: 8,
            isActive: true,
            isStablecoin: false,
            createdAt: BigInt(Date.now()),
            createdById: userId,
            updatedAt: BigInt(Date.now()),
            updatedById: userId,
        };
        tokenRepository.create.mockResolvedValue(expectedToken);

        // Act
        const result = await handler.execute(command);

        // Assert
        expect(result).toEqual(expectedToken);
        expect(tokenRepository.findBySymbol).toHaveBeenCalledWith('BTC');
        expect(tokenRepository.create).toHaveBeenCalled();
    });

    it('should throw ConflictException when token already exists', async () => {
        // Arrange
        const createTokenDto: CreateTokenDto = {
            symbol: 'BTC',
            name: 'Bitcoin',
            refId: 'bitcoin',
            decimals: 8,
            isStablecoin: false,
        };
        const userId = 'user-123';
        const command = new CreateTokenCommand(createTokenDto, userId);

        const existingToken: IToken = {
            id: 'existing-token',
            symbol: 'BTC',
            name: 'Bitcoin',
            refId: 'bitcoin',
            decimals: 8,
            isActive: true,
            isStablecoin: false,
            createdAt: BigInt(Date.now()),
            createdById: 'other-user',
            updatedAt: BigInt(Date.now()),
            updatedById: 'other-user',
        };
        tokenRepository.findBySymbol.mockResolvedValue(existingToken);

        // Act & Assert
        await expect(handler.execute(command)).rejects.toThrow(ConflictException);
        expect(tokenRepository.create).not.toHaveBeenCalled();
    });
});
```

#### 4.3 Integration Tests

**`src/modules/asset/__tests__/token.repository.integration.spec.ts`**

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TokenRepository } from '@modules/asset/infrastructure/persistence/token.repository';
import { TokenEntity } from '@modules/asset/infrastructure/persistence/token.persistence';
import { IToken } from '@modules/asset/domain/token.entity';

describe('TokenRepository Integration', () => {
    let tokenRepository: TokenRepository;
    let ormRepository: Repository<TokenEntity>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                TypeOrmModule.forRoot({
                    type: 'sqlite',
                    database: ':memory:',
                    entities: [TokenEntity],
                    synchronize: true,
                }),
                TypeOrmModule.forFeature([TokenEntity]),
            ],
            providers: [TokenRepository],
        }).compile();

        tokenRepository = module.get<TokenRepository>(TokenRepository);
        ormRepository = module.get<Repository<TokenEntity>>(getRepositoryToken(TokenEntity));
    });

    afterEach(async () => {
        await ormRepository.clear();
    });

    it('should create and find a token', async () => {
        // Arrange
        const tokenData: Partial<IToken> = {
            symbol: 'BTC',
            name: 'Bitcoin',
            refId: 'bitcoin',
            decimals: 8,
            isActive: true,
            isStablecoin: false,
            createdAt: BigInt(Date.now()),
            createdById: 'user-123',
            updatedAt: BigInt(Date.now()),
            updatedById: 'user-123',
        };

        // Act
        const createdToken = await tokenRepository.create(tokenData);
        const foundToken = await tokenRepository.findBySymbol('BTC');

        // Assert
        expect(createdToken).toBeDefined();
        expect(createdToken.symbol).toBe('BTC');
        expect(foundToken).toBeDefined();
        expect(foundToken?.symbol).toBe('BTC');
        expect(foundToken?.id).toBe(createdToken.id);
    });
});
```

#### 4.4 API Integration Tests

**`src/modules/asset/__tests__/asset.controller.integration.spec.ts`**

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AssetController } from '@modules/asset/infrastructure/controller/asset.controller';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { JwtAuthGuard } from '@modules/auth/infrastructure/jwt-auth.guard';

describe('AssetController Integration', () => {
    let app: INestApplication;
    let commandBus: jest.Mocked<CommandBus>;
    let queryBus: jest.Mocked<QueryBus>;

    beforeEach(async () => {
        const mockCommandBus = {
            execute: jest.fn(),
        };
        const mockQueryBus = {
            execute: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [AssetController],
            providers: [
                {
                    provide: CommandBus,
                    useValue: mockCommandBus,
                },
                {
                    provide: QueryBus,
                    useValue: mockQueryBus,
                },
            ],
        })
            .overrideGuard(JwtAuthGuard)
            .useValue({ canActivate: () => true })
            .compile();

        app = module.createNestApplication();
        await app.init();

        commandBus = module.get(CommandBus);
        queryBus = module.get(QueryBus);
    });

    afterEach(async () => {
        await app.close();
    });

    it('/assets/tokens (POST) should create a token', async () => {
        // Arrange
        const createTokenDto = {
            symbol: 'BTC',
            name: 'Bitcoin',
            refId: 'bitcoin',
            decimals: 8,
            isStablecoin: false,
        };
        const expectedResponse = { id: 'token-123', ...createTokenDto };
        commandBus.execute.mockResolvedValue(expectedResponse);

        // Act & Assert
        const response = await request(app.getHttpServer()).post('/assets/tokens').send(createTokenDto).expect(201);

        expect(response.body).toEqual(expectedResponse);
        expect(commandBus.execute).toHaveBeenCalled();
    });
});
```

**Checkpoint 4 Deliverables:**

- ✅ Integration with existing modules completed
- ✅ Unit tests for use cases implemented
- ✅ Repository integration tests created
- ✅ API integration tests implemented
- ✅ Module ready for production deployment

---

## API Endpoints Summary

### Token Management

- `POST /assets/tokens` - Create token (local storage)
- `GET /tokens/search?q={query}` - Search tokens (via ProviderModule)
- `GET /tokens/:id/price` - Get current price (via ProviderModule)

### Portfolio Holdings

- `POST /assets/portfolios/:portfolioId/holdings` - Add/update token holding
- `GET /assets/portfolios/:portfolioId/holdings` - Get token holdings with values
- `PUT /assets/portfolios/:portfolioId/holdings/:tokenId` - Update token holding
- `DELETE /assets/portfolios/:portfolioId/holdings/:tokenId` - Remove token holding

---

## Success Criteria

- [ ] All database tables created with proper indexes
- [ ] All CRUD operations implemented following CQRS pattern
- [ ] Real-time portfolio valuation working
- [ ] Price synchronization background job operational
- [ ] Portfolio token holdings automatically calculated
- [ ] API documentation updated
- [ ] Integration tests passing
- [ ] Performance benchmarks met

---

## Dependencies

- **External**: ProviderModule (for token price data)
- **Internal**: PortfolioModule (for portfolio ownership validation)
- **Database**: PostgreSQL with UUID extension
- **Background Jobs**: @nestjs/schedule for cron jobs

---

**Last Updated**: 30 May 2025  
**Next Phase**: Transaction Management Module (Phase 3)
