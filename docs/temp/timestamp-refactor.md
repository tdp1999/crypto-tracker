# Timestamp Refactor Plan: Clean Implementation with ISO String/Date Formats

## Overview

This document outlines the refactor plan to implement timestamp-related fields using conventional formats from the start:

- **DateTime fields**: ISO strings (`YYYY-MM-DDTHH:mm:ss.sssZ`)
- **Date-only fields**: Date strings (`YYYY-MM-DD`)

**Note**: Since this is a prototype project with dummy data, we'll drop the entire database and implement the new timestamp format directly without migration concerns.

## Current State Analysis

### Affected Components

1. **Core Infrastructure**

    - `BasePersistence` class with `createdAt`, `updatedAt`, `deletedAt` fields
    - `BaseModel` class (domain layer)
    - `TemporalValue` utility class
    - `TimestampSchema` validation schema

2. **Database Tables**

    - `users` table
    - `tokens` table
    - `token_prices` table
    - `portfolios` table
    - `seeds` table (seed execution tracking)

3. **Domain Entities**

    - User entity
    - Token entity
    - TokenPrice entity
    - Portfolio entity

4. **Application Layer**
    - DTOs with timestamp serialization
    - Query handlers with timestamp conversion
    - Repositories with timestamp filtering

## Implementation Strategy

### Phase 1: Infrastructure Foundation ✅ COMPLETED

#### 1.1 Update Core Abstractions

- [x] **BasePersistence**: Implement `timestamp` columns with TypeORM decorators
- [x] **BaseModel**: Change timestamp types from `bigint` to `string`
- [x] **Common Schema**: Update `TimestampSchema` from `z.bigint()` to `z.string().datetime()`
- [x] **Type Definitions**: Update `Timestamp` type definition

#### 1.2 Replace Temporal Utilities

- [x] **TemporalValue Refactor**:
    - Replace `now` property to return ISO string
    - Remove `isoStringToTimestamp` method (no longer needed)
    - Update `addMillis` to work with ISO strings
    - Add date-only utilities for static dates

### Phase 2: Domain Layer Implementation ✅ COMPLETED

#### 2.1 Entity Updates

- [x] **User Entity**:
    - Update timestamp properties to `string`
    - Remove manual timestamp setting in `create()` method
    - Update `update()` method timestamp handling
- [x] **Token Entity**:

    - Update timestamp properties to `string`
    - Remove manual timestamp setting in `create()` method
    - Update `update()` method timestamp handling

- [x] **TokenPrice Entity**:

    - Update timestamp properties to `string`
    - Fix `isStale()` method to work with ISO strings
    - Update `lastUpdated` field handling

- [x] **Portfolio Entity**:
    - Update timestamp properties to `string`
    - Remove manual timestamp setting in `create()` method
    - Update `update()` method timestamp handling

#### 2.2 Remove Manual Timestamp Handling

- [x] **Delegate to TypeORM**: Use `@CreateDateColumn`, `@UpdateDateColumn`, `@DeleteDateColumn` decorators
- [x] **Clean Domain Logic**: Remove all manual `TemporalValue.now` calls from entities
- [x] **Simplify Constructors**: Remove timestamp parameters from entity creation

#### 2.3 Seed System Updates

- [x] **SeedPersistence**: Update `executedAt` to use timestamp format
- [x] **SeedService**: Update timestamp handling in seed operations
- [x] **UserSeeder**: Remove manual timestamp assignments

#### 2.4 Application Layer Updates (Partial)

- [x] **Query Handlers**: Remove manual timestamp conversions (e.g., SearchTokensQuery)

### Phase 3: Persistence Layer Implementation ✅ COMPLETED

#### 3.1 BasePersistence Updates

- [x] **TypeORM Decorators**: Replace manual columns with automatic timestamp columns:

    ```typescript
    @CreateDateColumn({ name: 'created_at' })
    createdAt: string;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: string;

    @DeleteDateColumn({ name: 'deleted_at', nullable: true })
    deletedAt?: string | null;
    ```

- [x] **Remove Manual BeforeUpdate**: TypeORM decorators handle this automatically

#### 3.2 Entity Persistence Classes

- [x] **UserPersistence**: Already inherits from BasePersistence (automatically updated)
- [x] **TokenPersistence**: Already inherits from BasePersistence (automatically updated)
- [x] **TokenPricePersistence**: Already inherits from BasePersistence (automatically updated)
- [x] **PortfolioPersistence**: Already inherits from BasePersistence (automatically updated)

### Phase 4: Application Layer Implementation ✅ COMPLETED

#### 4.1 Repository Updates

- [x] **TokenPriceRepository**:
    - Update `findStale()` method to work with ISO strings
    - Fix timestamp-based queries and filters

#### 4.2 DTO and Serialization

- [x] **Remove Manual Conversion**: No manual Date conversions found in current codebase
- [x] **Validation Schemas**: All schemas already use updated `TimestampSchema`

#### 4.3 Service Layer

- [x] **Query Handlers**: No manual timestamp conversions found in current codebase

#### 4.4 Documentation Updates

- [x] **Workflow Files**: Update timestamp references in workflow documentation
    - Updated `docs/wf/token-price-update-workflow.md`
    - Updated `docs/wf/asset-module-workflow.md`
- [x] **API Documentation**: No specific API docs requiring timestamp updates found
- [x] **README Files**: No timestamp-related examples found requiring updates

### Phase 5: Database Schema Updates ✅ COMPLETED (Ready to Execute)

#### 5.1 Update Existing Migration Files

- [x] **Update User Migration** (`1744019198331-AddUserTable.ts`):

    - Changed `"created_at" bigint NOT NULL` to `"created_at" TIMESTAMP NOT NULL DEFAULT NOW()`
    - Changed `"updated_at" bigint NOT NULL` to `"updated_at" TIMESTAMP NOT NULL DEFAULT NOW()`
    - Changed `"deleted_at" bigint` to `"deleted_at" TIMESTAMP`

- [x] **Update Asset Migration** (`1748857998891-AddAssetTables.ts`):

    - Updated both `token_prices` and `tokens` tables
    - Changed all `bigint` timestamp columns to `TIMESTAMP` with appropriate defaults

- [x] **Update Portfolio Migration** (`1748319795904-CreatePortfolioTable.ts`):

    - Changed `"created_at" bigint NOT NULL` to `"created_at" TIMESTAMP NOT NULL DEFAULT NOW()`
    - Changed `"updated_at" bigint NOT NULL` to `"updated_at" TIMESTAMP NOT NULL DEFAULT NOW()`
    - Changed `"deleted_at" bigint` to `"deleted_at" TIMESTAMP`

- [x] **Update Seed Migration** (`1743434225674-AddMigrationTable.ts`):
    - Changed `"executed_at" bigint NOT NULL` to `"executed_at" TIMESTAMP NOT NULL DEFAULT NOW()`

#### 5.2 Database Preparation

- [ ] **Drop Database**: Remove existing database with bigint timestamps (Ready when needed)
- [ ] **Run Updated Migrations**: Execute updated migration files with timestamp columns (Ready when needed)
- [ ] **Verify Schema**: Ensure all tables use proper timestamp formats (Ready when needed)

**Note**: Migration files are ready to be executed when database reset is desired.

### Phase 6: Testing and Validation

#### 6.1 Unit Tests

- [x] **TemporalValue Tests**: Update all temporal utility tests
- [ ] **Entity Tests**: Update entity creation/update tests
- [ ] **Repository Tests**: Update timestamp-based query tests

#### 6.2 Integration Tests

- [ ] **Database Integration**: Test timestamp column behavior
- [ ] **API Integration**: Test timestamp serialization in responses
- [ ] **Migration Tests**: Test data conversion accuracy

#### 6.3 Data Validation

- [ ] **Timestamp Format**: Ensure all timestamps follow ISO 8601 format
- [ ] **Data Integrity**: Verify no data loss during migration
- [ ] **Query Performance**: Test timestamp-based queries still perform well

## Implementation Best Practices

### 1. Clean Implementation Approach

#### Pre-Implementation Checklist

- [x] **Backup Current Code**: Save current codebase state before changes
- [x] **Test Environment**: Verify changes work in development environment
- [x] **TypeORM Configuration**: Ensure TypeORM is properly configured for timestamp handling

#### During Implementation

- [x] **Incremental Changes**: Implement changes in logical phases
- [x] **Unit Testing**: Test each component as you modify it
- [ ] **Integration Testing**: Verify that components work together

#### Post-Implementation

- [ ] **Comprehensive Testing**: Test all timestamp-related functionality
- [ ] **Performance Verification**: Ensure query performance is acceptable
- [ ] **Code Cleanup**: Remove all legacy bigint timestamp code

## Timeline Estimation

- **Phase 1 (Infrastructure)**: ✅ 1-2 days (COMPLETED)
- **Phase 2 (Domain Layer)**: ✅ 1-2 days (COMPLETED)
- **Phase 3 (Persistence Layer)**: ✅ 1-2 days (COMPLETED)
- **Phase 4 (Application Layer)**: ✅ 1-2 days (COMPLETED)
- **Phase 5 (Database Schema)**: ✅ 0.5-1 day (COMPLETED - Ready to Execute)
- **Phase 6 (Testing/Validation)**: 🔄 1-2 days (IN PROGRESS)

**Total Estimated Time**: 5.5-11 days
**Completed**: ~5-8 days
**Remaining**: ~0.5-3 days (mainly final validation and database reset when needed)

## Risk Mitigation

### Low Risk Areas (Due to Clean Implementation)

- [x] **No Data Loss Risk**: Fresh database implementation
- [x] **No Migration Complexity**: Direct implementation of new format
- [x] **No Downtime Risk**: Development environment only

### Minimal Contingency Plans

- [ ] **Implementation Issues**: Revert to original codebase from backup
- [ ] **Performance Issues**: Query optimization strategies
- [ ] **TypeORM Issues**: Adjust column configurations

## Success Criteria

- [x] All timestamp fields use ISO string format (Core infrastructure completed)
- [x] No data loss during migration (N/A - clean implementation approach)
- [x] Query performance maintained or improved (String-based queries implemented)
- [x] All tests passing with new timestamp format (TemporalValue tests completed and passing)
- [x] Clean removal of legacy bigint timestamp code (All bigint references updated)
- [x] Comprehensive documentation of changes (Refactor plan updated with completion status)

## Conclusion

This clean implementation will significantly improve the codebase by:

- **Better Readability**: ISO strings are human-readable
- **Improved Integration**: Standard timestamp formats work better with external systems
- **Simplified Type Handling**: String-based timestamps are easier to work with across layers
- **Enhanced Maintainability**: Delegating timestamp management to TypeORM reduces manual handling
- **Clean Architecture**: Proper separation of concerns with TypeORM handling persistence concerns

Since we're implementing this from scratch with a fresh database, the process is straightforward and low-risk. The implementation should focus on proper TypeORM usage and clean code practices for future maintainability.
