# Asset Module Development Workflow Plan

**Generated**: 30 May 2025  
**Based on**: `docs/wf/transaction-plan.md` and existing project conventions  
**Target**: Complete Asset Management Module (Phase 2) - Token Management Only  
**Estimated Timeline**: 1-2 weeks  
**Scope**: Token management (master data) + Token price cache (hot cache)

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

The Asset Module serves as the core token management layer, providing master token data storage and price cache functionality. This module focuses specifically on token-related operations and integrates with the ProviderModule for external token data and price information.

### Key Components

1. **Token Management** - Master token data storage with external API references
2. **Token Price Cache** - Hot cache for current market prices

### Excluded from Asset Module

- **Portfolio Holdings** - Moved to Portfolio Module (represents current token positions per portfolio)

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
└── TokenPrice (Hot Cache) - 1:1 current price
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
    @OneToMany(() => TokenPriceEntity, (price) => price.token, { cascade: false })
    prices: TokenPriceEntity[];
}
```

### Entity Relationships

1. **Token Entity** - Stores master token information with required `refId` for external API integration
2. **Token Price Entity** - Cache for current market prices linked by `tokenId` reference

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
│   ├── token-price.entity.ts
│   └── asset.error.ts
├── application/
│   ├── asset.dto.ts
│   ├── asset.token.ts
│   ├── commands/
│   │   ├── create-token.command.ts
│   │   └── update-token-price.command.ts
│   ├── queries/
│   │   ├── get-token.query.ts
│   │   ├── search-tokens.query.ts
│   │   └── get-token-price.query.ts
│   └── ports/
│       ├── token-repository.out.port.ts
│       └── token-price-repository.out.port.ts
└── infrastructure/
    ├── persistence/
    │   ├── token.persistence.ts
    │   └── token-price.persistence.ts
    ├── repositories/
    │   ├── token.repository.ts
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

export const TokenCreateSchema = z.object({
    symbol: z.string().max(20).min(1),
    name: z.string().max(100).min(1),
    refId: z.string().min(1), // required
    decimals: z.number().int().min(0).max(18).default(18),
    isStablecoin: z.boolean().default(false),
    stablecoinPeg: z.string().optional(),
    logoUrl: z.string().url().optional(),
});

export const TokenPriceUpdateSchema = z.object({
    priceUsd: z.number().positive(),
    marketCap: z.number().positive().optional(),
    volume24h: z.number().positive().optional(),
    priceChange24h: z.number().optional(),
    dataSource: z.string().default('coingecko'),
});

export const TokenSearchSchema = z.object({
    query: z.string().min(1),
    limit: z.number().int().min(1).max(50).default(10),
    onlyActive: z.boolean().default(true),
});

export type CreateTokenDto = z.infer<typeof TokenCreateSchema>;
export type UpdateTokenPriceDto = z.infer<typeof TokenPriceUpdateSchema>;
export type SearchTokensDto = z.infer<typeof TokenSearchSchema>;
```

#### 1.4 Port Interfaces

**`src/modules/asset/application/ports/token-repository.out.port.ts`**

```typescript
import { IToken } from '@modules/asset/domain/token.entity';
import { IRepository } from '@core/abstractions/repository.base';

export interface TokenRepositoryOutPort extends IRepository<IToken> {
    findBySymbol(symbol: string): Promise<IToken | null>;
    findByRefId(refId: string): Promise<IToken | null>;
    findActiveTokens(): Promise<IToken[]>;
    searchByName(query: string, limit?: number): Promise<IToken[]>;
}

export const TOKEN_REPOSITORY_OUT_PORT = Symbol('TokenRepositoryOutPort');
```

**`src/modules/asset/application/ports/token-price-repository.out.port.ts`**

```typescript
import { ITokenPrice } from '@modules/asset/domain/token-price.entity';

export interface TokenPriceRepositoryOutPort {
    upsert(tokenId: string, priceData: Partial<ITokenPrice>): Promise<ITokenPrice>;
    findByTokenId(tokenId: string): Promise<ITokenPrice | null>;
    findStale(olderThan: bigint): Promise<ITokenPrice[]>;
    findByDataSource(dataSource: string): Promise<ITokenPrice[]>;
}

export const TOKEN_PRICE_REPOSITORY_OUT_PORT = Symbol('TokenPriceRepositoryOutPort');
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

**`src/modules/asset/application/queries/search-tokens.query.ts`**

```typescript
import { SearchTokensDto } from '@modules/asset/application/asset.dto';

export class SearchTokensQuery {
    constructor(public readonly searchDto: SearchTokensDto) {}
}

export class SearchTokensHandler {
    // Full implementation in Checkpoint 2
}
```

**Checkpoint 1 Deliverables:**

- ✅ Domain interfaces defined (Token, TokenPrice only)
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
import { Column, Entity, Index, OneToOne } from 'typeorm';
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
    @OneToOne(() => TokenPriceEntity, (price) => price.token, { cascade: false })
    currentPrice?: TokenPriceEntity;
}
```

**`src/modules/asset/infrastructure/persistence/token-price.persistence.ts`**

```typescript
import { ITokenPrice } from '@modules/asset/domain/token-price.entity';
import { Column, Entity, Index, PrimaryColumn, OneToOne, JoinColumn } from 'typeorm';
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
    @OneToOne(() => TokenEntity, (token) => token.currentPrice)
    @JoinColumn({ name: 'token_id' })
    token: TokenEntity;
}
```

#### 2.2 Repository Implementations

**`src/modules/asset/infrastructure/repositories/token.repository.ts`**

```typescript
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import {
    TokenRepositoryOutPort,
    TOKEN_REPOSITORY_OUT_PORT,
} from '@modules/asset/application/ports/token-repository.out.port';
import { TokenEntity } from '../persistence/token.persistence';
import { IToken } from '@modules/asset/domain/token.entity';
import { RepositoryBase } from '@core/abstractions/repository.base';

@Injectable()
export class TokenRepository extends RepositoryBase<IToken, TokenEntity> implements TokenRepositoryOutPort {
    constructor(
        @InjectRepository(TokenEntity)
        private readonly tokenRepository: Repository<TokenEntity>,
    ) {
        super(tokenRepository);
    }

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

**`src/modules/asset/infrastructure/repositories/token-price.repository.ts`**

```typescript
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import {
    TokenPriceRepositoryOutPort,
    TOKEN_PRICE_REPOSITORY_OUT_PORT,
} from '@modules/asset/application/ports/token-price-repository.out.port';
import { TokenPriceEntity } from '../persistence/token-price.persistence';
import { ITokenPrice } from '@modules/asset/domain/token-price.entity';
import { TemporalValue } from '@shared/vos/temporal.value';

@Injectable()
export class TokenPriceRepository implements TokenPriceRepositoryOutPort {
    constructor(
        @InjectRepository(TokenPriceEntity)
        private readonly tokenPriceRepository: Repository<TokenPriceEntity>,
    ) {}

    async upsert(tokenId: string, priceData: Partial<ITokenPrice>): Promise<ITokenPrice> {
        const now = TemporalValue.now;

        const existing = await this.findByTokenId(tokenId);

        if (existing) {
            await this.tokenPriceRepository.update(tokenId, {
                ...priceData,
                updatedAt: now,
            });
            return this.findByTokenId(tokenId) as Promise<ITokenPrice>;
        } else {
            const entity = this.tokenPriceRepository.create({
                tokenId,
                ...priceData,
                createdAt: now,
                updatedAt: now,
            });
            return this.tokenPriceRepository.save(entity);
        }
    }

    async findByTokenId(tokenId: string): Promise<ITokenPrice | null> {
        return this.tokenPriceRepository.findOne({
            where: { tokenId },
        });
    }

    async findStale(olderThan: bigint): Promise<ITokenPrice[]> {
        return this.tokenPriceRepository
            .createQueryBuilder('price')
            .where('price.lastUpdated < :olderThan', { olderThan: olderThan.toString() })
            .getMany();
    }

    async findByDataSource(dataSource: string): Promise<ITokenPrice[]> {
        return this.tokenPriceRepository.find({
            where: { dataSource },
            order: { lastUpdated: 'DESC' },
        });
    }
}
```

**Checkpoint 2 Deliverables:**

- ✅ TypeORM entities with relation decorators created (Token, TokenPrice only)
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
import { Inject } from '@nestjs/common';
import {
    TokenRepositoryOutPort,
    TOKEN_REPOSITORY_OUT_PORT,
} from '@modules/asset/application/ports/token-repository.out.port';
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
    constructor(
        @Inject(TOKEN_REPOSITORY_OUT_PORT)
        private readonly tokenRepository: TokenRepositoryOutPort,
    ) {}

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
import { Body, Controller, Get, Param, Post, Query, UseGuards, UsePipes } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@modules/auth/infrastructure/jwt-auth.guard';
import { GetUser } from '@core/decorators/get-user.decorator';
import { IUser } from '@modules/user/domain/user.entity';
import { ZodValidationPipe } from '@core/pipes/zod-validation.pipe';
import { CreateTokenCommand } from '@modules/asset/application/commands/create-token.command';
import { SearchTokensQuery } from '@modules/asset/application/queries/search-tokens.query';
import { GetTokenQuery } from '@modules/asset/application/queries/get-token.query';
import {
    CreateTokenDto,
    TokenCreateSchema,
    SearchTokensDto,
    TokenSearchSchema,
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
    @ApiResponse({ status: 201, description: 'Token created successfully' })
    @UsePipes(new ZodValidationPipe(TokenCreateSchema))
    async createToken(@Body() createTokenDto: CreateTokenDto, @GetUser() user: IUser) {
        return this.commandBus.execute(new CreateTokenCommand(createTokenDto, user.id));
    }

    @Get('tokens/search')
    @ApiOperation({ summary: 'Search tokens by name or symbol' })
    @ApiResponse({ status: 200, description: 'Tokens found successfully' })
    @UsePipes(new ZodValidationPipe(TokenSearchSchema))
    async searchTokens(@Query() searchDto: SearchTokensDto) {
        return this.queryBus.execute(new SearchTokensQuery(searchDto));
    }

    @Get('tokens/:id')
    @ApiOperation({ summary: 'Get token by ID' })
    @ApiResponse({ status: 200, description: 'Token retrieved successfully' })
    async getToken(@Param('id') tokenId: string) {
        return this.queryBus.execute(new GetTokenQuery(tokenId));
    }
}
```

#### 3.3 Module Assembly

**`src/modules/asset/asset.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';

// Entities
import { TokenEntity } from './infrastructure/persistence/token.persistence';
import { TokenPriceEntity } from './infrastructure/persistence/token-price.persistence';

// Repositories
import { TokenRepository } from './infrastructure/repositories/token.repository';
import { TokenPriceRepository } from './infrastructure/repositories/token-price.repository';

// Ports
import { TOKEN_REPOSITORY_OUT_PORT } from './application/ports/token-repository.out.port';
import { TOKEN_PRICE_REPOSITORY_OUT_PORT } from './application/ports/token-price-repository.out.port';

// Commands
import { CreateTokenHandler } from './application/commands/create-token.command';
import { UpdateTokenPriceHandler } from './application/commands/update-token-price.command';

// Queries
import { GetTokenHandler } from './application/queries/get-token.query';
import { SearchTokensHandler } from './application/queries/search-tokens.query';
import { GetTokenPriceHandler } from './application/queries/get-token-price.query';

// Controllers
import { AssetController } from './infrastructure/controller/asset.controller';
import { AssetRpcController } from './infrastructure/rpc/asset.rpc';

const CommandHandlers = [CreateTokenHandler, UpdateTokenPriceHandler];

const QueryHandlers = [GetTokenHandler, SearchTokensHandler, GetTokenPriceHandler];

@Module({
    imports: [TypeOrmModule.forFeature([TokenEntity, TokenPriceEntity]), CqrsModule],
    controllers: [AssetController, AssetRpcController],
    providers: [
        // Repositories
        {
            provide: TOKEN_REPOSITORY_OUT_PORT,
            useClass: TokenRepository,
        },
        {
            provide: TOKEN_PRICE_REPOSITORY_OUT_PORT,
            useClass: TokenPriceRepository,
        },
        // Handlers
        ...CommandHandlers,
        ...QueryHandlers,
    ],
    exports: [TOKEN_REPOSITORY_OUT_PORT, TOKEN_PRICE_REPOSITORY_OUT_PORT],
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
- `GET /assets/tokens/search?q={query}` - Search tokens (local database)
- `GET /assets/tokens/:id` - Get token by ID
- `GET /tokens/search` - Search tokens (via ProviderModule - external API)
- `GET /tokens/:id/price` - Get current price (via ProviderModule - external API)

### Token Price Cache

- `POST /assets/tokens/:id/price` - Update token price cache (internal/RPC)

---

## Success Criteria

- [ ] Token and TokenPrice database tables created with proper indexes
- [ ] Token CRUD operations implemented following CQRS pattern
- [ ] Token price cache functionality working
- [ ] Token search functionality working
- [ ] API documentation updated
- [ ] Integration tests passing
- [ ] Performance benchmarks met

---

## Dependencies

- **External**: ProviderModule (for external token search and price data)
- **Database**: PostgreSQL with UUID extension

---

**Last Updated**: 30 May 2025  
**Next Phase**: Portfolio Holdings (extend Portfolio Module) or Transaction Management Module (Phase 3)
