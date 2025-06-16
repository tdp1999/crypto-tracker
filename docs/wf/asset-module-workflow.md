# Asset Module Development Workflow Plan

**Generated**: 30 May 2025  
**Updated**: Current Date
**Based on**: `docs/wf/transaction-plan.md` and existing project conventions  
**Target**: Complete Asset Management Module (Phase 2) - Token Management Only  
**Estimated Timeline**: 1-2 weeks  
**Scope**: Token management (master data) + Token price cache (hot cache)

---

## Table of Contents

1. [Overview](#overview)
2. [Entity Structure & Relationships](#entity-structure--relationships)
3. [Implementation Checkpoints](#implementation-checkpoints)
    - [Checkpoint 1: Domain Layer](#checkpoint-1-domain-layer-days-1-2) ✅ **COMPLETE**
    - [Checkpoint 2: Persistence Layer](#checkpoint-2-persistence-layer-days-3-4) 🟡 **PARTIAL** (~40%)
    - [Checkpoint 3: API Layer](#checkpoint-3-api-layer-days-5-6) ❌ **NOT STARTED**
    - [Checkpoint 4: Integration & Testing](#checkpoint-4-integration--testing-days-7-8) ❌ **NOT STARTED**
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
@Index('IDX_tokens_symbol', ['symbol'])
@Index('IDX_tokens_ref_id', ['refId'])
@Index('IDX_tokens_is_active', ['isActive'])
export class TokenPersistence extends BasePersistence implements IToken {
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

### ✅ Checkpoint 1: Domain Layer (Days 1-2) - **COMPLETE**

**Objective**: Establish core business logic, domain interfaces, and data validation schemas.

#### 1.1 Folder Structure Setup

```bash
src/modules/asset/
├── asset.module.ts ✅
├── domain/
│   ├── token.entity.ts ✅
│   ├── token-price.entity.ts ✅
│   └── asset.error.ts ✅
├── application/
│   ├── asset.dto.ts ✅
│   ├── asset.token.ts ✅
│   ├── commands/
│   │   ├── create-token.command.ts ✅
│   │   ├── update-token.command.ts ✅
│   │   └── update-token-price.command.ts ✅
│   ├── queries/
│   │   ├── get-token.query.ts ✅
│   │   ├── search-tokens.query.ts ✅
│   │   └── get-token-price.query.ts ✅
│   └── ports/
│       ├── token-repository.out.port.ts ✅
│       └── token-price-repository.out.port.ts ✅
└── infrastructure/
    ├── persistence/
    │   ├── token.persistence.ts ✅ (partial)
    │   └── token-price.persistence.ts ❌
    ├── repositories/
    │   ├── token.repository.ts ✅
    │   └── token-price.repository.ts ❌
    ├── controller/
    │   └── asset.controller.ts ❌
    └── rpc/
        └── asset.rpc.ts ❌
```

#### 1.2 Domain Interfaces ✅

**`src/modules/asset/domain/token.entity.ts`** ✅ **IMPLEMENTED**

- ✅ IToken interface with proper Zod schema
- ✅ Token domain class with factory methods
- ✅ TokenCreateSchema and TokenUpdateSchema
- ✅ Business logic for symbol normalization
- ✅ Proper error handling

**`src/modules/asset/domain/token-price.entity.ts`** ✅ **IMPLEMENTED**

- ✅ ITokenPrice interface
- ✅ TokenPrice domain class
- ✅ Zod validation schemas

#### 1.3 Zod Validation Schemas ✅

**`src/modules/asset/application/asset.dto.ts`** ✅ **IMPLEMENTED**

- ✅ TokenSearchSchema with entity query factory
- ✅ Response DTOs (TokenResponseDto, TokenPriceResponseDto)
- ✅ Proper type exports
- ✅ Query schema validation

#### 1.4 Port Interfaces ✅

**`src/modules/asset/application/ports/token-repository.out.port.ts`** ✅ **IMPLEMENTED**
**`src/modules/asset/application/ports/token-price-repository.out.port.ts`** ✅ **IMPLEMENTED**

#### 1.5 Command & Query Handlers ✅

- ✅ **AddTokenCommand** & Handler - Full implementation
- ✅ **UpdateTokenCommand** & Handler - Full implementation
- ✅ **UpdateTokenPriceCommand** & Handler - Full implementation
- ✅ **GetTokenQuery** & Handler - Full implementation
- ✅ **SearchTokensQuery** & Handler - Full implementation
- ✅ **GetTokenPriceQuery** & Handler - Full implementation

**Checkpoint 1 Deliverables:** ✅ **ALL COMPLETE**

- ✅ Domain interfaces defined (Token, TokenPrice)
- ✅ Zod validation schemas created
- ✅ Port interfaces defined
- ✅ Command/Query handlers fully implemented
- ✅ Module folder structure established
- ✅ Error handling and business logic complete

---

### 🟡 Checkpoint 2: Persistence Layer (Days 3-4) - **PARTIAL (~40%)**

**Objective**: Create TypeORM entities with proper decorators and relationships, implement persistence logic, and connect ports with adapters.

#### 2.1 TypeORM Entities

**`src/modules/asset/infrastructure/persistence/token.persistence.ts`** ✅ **IMPLEMENTED**

- ✅ TokenEntity with proper decorators and indexes
- ⚠️ Missing relation to TokenPriceEntity (needs TokenPrice implementation)

**`src/modules/asset/infrastructure/persistence/token-price.persistence.ts`** ❌ **MISSING**

Required implementation:

```typescript
import { ITokenPrice } from '@modules/asset/domain/token-price.entity';
import {
    Column,
    Entity,
    Index,
    PrimaryColumn,
    OneToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { TokenEntity } from './token.persistence';

@Entity('token_prices_current')
@Index('IDX_token_prices_datasource', ['dataSource'])
export class TokenPricePersistence implements ITokenPrice {
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

    @Column({ name: 'last_updated' })
    lastUpdated: string;

    @Column({ name: 'data_source', length: 50, default: 'coingecko' })
    dataSource: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: string;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: string;

    // Relations for modeling purposes (no foreign keys in DB)
    @OneToOne(() => TokenEntity, (token) => token.currentPrice)
    @JoinColumn({ name: 'token_id' })
    token: TokenEntity;
}
```

#### 2.2 Repository Implementations

**`src/modules/asset/infrastructure/repositories/token.repository.ts`** ✅ **IMPLEMENTED**

- ✅ Full TokenRepository implementation with all required methods
- ✅ Proper search functionality
- ✅ Symbol and refId lookups

**`src/modules/asset/infrastructure/repositories/token-price.repository.ts`** ❌ **MISSING**

Required implementation following the workflow plan pattern.

#### 2.3 Remaining Tasks for Checkpoint 2

- ❌ Create TokenPriceEntity persistence class
- ❌ Implement TokenPriceRepository
- ❌ Update TokenEntity to include relation decorator
- ❌ Generate database migrations
- ❌ Update module DI configuration

**Checkpoint 2 Status:** 🟡 **40% COMPLETE**

**Completed:**

- ✅ Token persistence entity
- ✅ Token repository implementation

**Remaining:**

- ❌ TokenPrice persistence entity
- ❌ TokenPrice repository implementation
- ❌ Complete TypeORM entity relationships
- ❌ Database migrations

---

### ❌ Checkpoint 3: API Layer (Days 5-6) - **NOT STARTED**

**Objective**: Create HTTP API endpoints, RPC handlers, and input validation using Zod schemas.

#### 3.1 Command & Query Handlers

✅ **Already implemented in Checkpoint 1** - All handlers are complete

#### 3.2 HTTP Controller ❌ **MISSING**

**`src/modules/asset/infrastructure/controller/asset.controller.ts`** - Needs implementation

#### 3.3 RPC Controller ❌ **MISSING**

**`src/modules/asset/infrastructure/rpc/asset.rpc.ts`** - Needs implementation

#### 3.4 Module Assembly ❌ **INCOMPLETE**

**`src/modules/asset/asset.module.ts`** - Basic structure exists but missing:

- TypeORM entity imports
- Repository providers
- Handler registrations
- Controller registrations

**Checkpoint 3 Deliverables:** ❌ **0% COMPLETE**

- ❌ HTTP API endpoints with Zod validation
- ❌ RPC handlers for inter-service communication
- ❌ Complete module assembly
- ❌ Route definitions and input validation

---

### ❌ Checkpoint 4: Integration & Testing (Days 7-8) - **NOT STARTED**

**Objective**: Integrate with existing modules, implement comprehensive testing, and ensure production readiness.

#### 4.1 Integration with Existing Modules ❌

Update **`src/app.module.ts`** to include the AssetModule

#### 4.2 Testing ❌

- Unit tests for use cases
- Repository integration tests
- API integration tests

**Checkpoint 4 Deliverables:** ❌ **0% COMPLETE**

- ❌ Integration with existing modules completed
- ❌ Unit tests for use cases implemented
- ❌ Repository integration tests created
- ❌ API integration tests implemented
- ❌ Module ready for production deployment

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

### Progress Tracking

- [x] ✅ Token and TokenPrice domain entities created
- [x] ✅ CQRS command/query handlers implemented
- [x] ✅ Zod validation schemas established
- [x] ✅ Port interfaces defined
- [x] ✅ Token persistence and repository implemented
- [ ] ❌ TokenPrice persistence and repository implemented
- [ ] ❌ Token price cache functionality working
- [ ] ❌ API endpoints created with proper validation
- [ ] ❌ Module assembly completed
- [ ] ❌ Database migrations generated
- [ ] ❌ Integration tests passing
- [ ] ❌ API documentation updated
- [ ] ❌ Performance benchmarks met

---

## Dependencies

- **External**: ProviderModule (for external token search and price data)
- **Database**: PostgreSQL with UUID extension

---

## Next Immediate Steps

**Priority 1 - Complete Checkpoint 2:**

1. Implement `TokenPriceEntity` persistence class
2. Implement `TokenPriceRepository`
3. Update `TokenEntity` relations
4. Generate database migrations

**Priority 2 - Begin Checkpoint 3:**

1. Create HTTP controller with endpoints
2. Create RPC controller
3. Complete module assembly with DI
4. Test API endpoints

---

**Last Updated**: Current Date  
**Overall Progress**: ~25% Complete (1 of 4 checkpoints complete)
**Next Phase**: Portfolio Holdings (extend Portfolio Module) or Transaction Management Module (Phase 3)
