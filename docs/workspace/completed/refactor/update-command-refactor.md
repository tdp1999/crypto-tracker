# Repository Create/Update Method Refactor Plan

## Overview

Refactor repository `add()` and `update()` methods to accept full domain entities instead of DTOs, ensuring domain logic is consistently enforced and eliminating the manual mapping step in command handlers.

## Current State Analysis

### Current Repository Interface

```typescript
export interface IRepository<T, Search, Add, Update>
    extends IRepositoryCommand<Add, Update>,
        IRepositoryQuery<T, Search> {
    add(data: Add): Promise<Id>;
    update(id: Id, data: Update): Promise<boolean>;
}
```

### Current Problems

1. **Manual Mapping**: Command handlers manually extract fields from domain entities to create DTOs
2. **Type Inconsistency**: Repository accepts `Add`/`Update` DTOs but domain works with full entities
3. **Potential Data Loss**: Manual mapping may miss fields or include wrong ones
4. **Maintenance Overhead**: Changes to entity structure require updates in multiple places
5. **Inconsistent Patterns**: Create and update operations follow different patterns

## Selected Approach: Option B (Breaking Change for Both Create and Update)

### 1. Repository Interface Updates

**New Interface Structure:**

```typescript
export interface IRepositoryCommand<T> {
    add(entity: T): Promise<Id>;
    update(id: Id, entity: T): Promise<boolean>;
    remove(id: Id): Promise<boolean>;
}

export interface IRepository<T, Search> extends IRepositoryCommand<T>, IRepositoryQuery<T, Search> {}
```

### 2. TypeORM Save Method Implementation

Since entity and persistence models share the same interface, we'll use TypeORM's `save()` method for both create and update operations with proper persistence instance creation:

```typescript
class PortfolioRepository {
    async add(entity: Portfolio): Promise<Id> {
        const persistenceInstance = this.portfolioRepository.create(entity);
        const savedEntity = await this.portfolioRepository.save(persistenceInstance);
        return savedEntity.id;
    }

    async update(id: Id, entity: Portfolio): Promise<boolean> {
        try {
            // Ensure the entity has the correct ID
            const entityWithId = { ...entity, id };
            const persistenceInstance = this.portfolioRepository.create(entityWithId);
            await this.portfolioRepository.save(persistenceInstance);
            return true;
        } catch (error) {
            return false;
        }
    }
}
```

### 3. Implementation Strategy

#### Phase 1: Core Interface Breaking Changes

1. **Update Base Repository Interface**

    - Remove `Add` and `Update` generic type parameters
    - Change `add()` method signature to accept full entity
    - Change `update()` method signature to accept full entity
    - Update all repository type definitions
    - Use consistent `T` generic naming

2. **Update Repository Implementations**
    - Replace `add()` and `update()` logic with TypeORM `create()` then `save()` pattern
    - Remove manual field mapping
    - Leverage shared entity/persistence interface

#### Phase 2: Application Layer Updates

1. **Update Command Handlers**
    - Remove manual DTO extraction logic for both create and update
    - Pass full domain entity directly to repository
    - Simplify command handler implementation

#### Phase 3: Type System Cleanup

1. **Remove Create/Update DTOs**
    - Delete unused `*CreateDto` and `*UpdateDto` types where applicable
    - Update port interfaces to remove `Add`/`Update` generics
    - Clean up import statements

## Impact Analysis

### Files Affected

#### Core Infrastructure (Breaking Changes)

- `src/core/interfaces/repository.interface.ts` - Interface signature change
- All repository implementations in `*/infrastructure/repositories/`
- All repository port interfaces in `*/application/ports/`

#### Module-Specific (Breaking Changes)

**Portfolio Module:**

- `src/modules/portfolio/application/ports/portfolio-repository.out.port.ts`
- `src/modules/portfolio/infrastructure/portfolio.repository.ts`
- `src/modules/portfolio/application/commands/create-portfolio.command.ts`
- `src/modules/portfolio/application/commands/update-portfolio.command.ts`

**Asset Module:**

- `src/modules/asset/application/ports/token-repository.out.port.ts`
- `src/modules/asset/application/commands/create-token.command.ts`
- `src/modules/asset/application/commands/update-token.command.ts`

**User Module:**

- `src/modules/user/application/ports/user-repository.out.port.ts`
- `src/modules/user/application/commands/create-user.command.ts` (if exists)
- `src/modules/user/application/commands/update-user.command.ts`

### Risk Assessment

#### High Risk

- **Breaking Changes**: All repository implementations will need immediate updates
- **Compilation Errors**: Extensive TypeScript errors until all files are updated
- **Testing**: All repository-related tests need updates

#### Medium Risk

- **TypeORM Behavior**: `save()` method may have different transaction behavior than `insert()`/`update()`
- **Performance**: `save()` may be slightly less efficient than targeted operations

#### Low Risk

- **Entity Mapping**: No mapping needed since entities share same interface
- **Domain Logic**: Domain logic remains unchanged

## Implementation Steps

### Step 1: Core Interface Updates

```typescript
// src/core/interfaces/repository.interface.ts
export interface IRepositoryCommand<T> {
    add(entity: T): Promise<Id>;
    update(id: Id, entity: T): Promise<boolean>;
    remove(id: Id): Promise<boolean>;
}

export interface IRepositoryQuery<T, Search> {
    list(query?: Search): Promise<T[]>;
    paginatedList(query?: Search): Promise<PaginatedResponse<T>>;
    findById(id: Id): Promise<T | null>;
    findByIds(ids: Id[]): Promise<FindByIdsResult<T, Id>>;
    findOne(conditions: Conditions): Promise<T | null>;
    exists(id: Id): Promise<boolean>;
}

export interface IRepository<T, Search> extends IRepositoryCommand<T>, IRepositoryQuery<T, Search> {}
```

### Step 2: Update Repository Port Interfaces

```typescript
// Example: src/modules/portfolio/application/ports/portfolio-repository.out.port.ts
export interface IPortfolioRepository extends IRepository<IPortfolio, PortfolioQueryDto> {
    findByUserAndName(userId: Id, name: string): Promise<Portfolio | null>;
    countByUserId(userId: Id): Promise<number>;
    findDefaultByUserId(userId: Id): Promise<Portfolio | null>;
}

// Example: src/modules/asset/application/ports/token-repository.out.port.ts
export type ITokenRepository = IRepository<IToken, SearchTokensDto> & {
    findBySymbol(symbol: string): Promise<IToken | null>;
    findByRefId(refId: string): Promise<IToken | null>;
    findActiveTokens(): Promise<IToken[]>;
    findByName(query: string, limit?: number): Promise<IToken[]>;
};
```

### Step 3: Update Repository Implementations

```typescript
// Example: src/modules/portfolio/infrastructure/portfolio.repository.ts
@Injectable()
export class PortfolioRepository implements IPortfolioRepository {
    constructor(
        @InjectRepository(PortfolioEntity)
        private readonly portfolioRepository: Repository<PortfolioEntity>,
    ) {}

    async add(entity: Portfolio): Promise<Id> {
        const persistenceInstance = this.portfolioRepository.create(entity);
        const savedEntity = await this.portfolioRepository.save(persistenceInstance);
        return savedEntity.id;
    }

    async update(id: Id, entity: Portfolio): Promise<boolean> {
        try {
            const entityWithId = { ...entity, id };
            const persistenceInstance = this.portfolioRepository.create(entityWithId);
            await this.portfolioRepository.save(persistenceInstance);
            return true;
        } catch (error) {
            console.error('Portfolio update failed:', error);
            return false;
        }
    }

    // ... other methods remain the same
}
```

### Step 4: Update Command Handlers

**Create Command Example:**

```typescript
// Example: src/modules/portfolio/application/commands/create-portfolio.command.ts
async execute(command: CreatePortfolioCommand): Promise<Id> {
    const { dto, userId } = command.payload;

    // ... validation logic remains the same ...

    // Use domain entity to create with domain logic
    const portfolio = Portfolio.create(dto, userId, userId);

    // Pass full entity directly to repository
    return await this.portfolioRepository.add(portfolio);
}
```

**Update Command Example:**

```typescript
// Example: src/modules/portfolio/application/commands/update-portfolio.command.ts
async execute(command: UpdatePortfolioCommand): Promise<boolean> {
    const { id, dto, userId } = command.payload;

    // ... validation logic remains the same ...

    // Use domain entity to apply updates with domain logic
    const updatedPortfolio = Portfolio.update(existingPortfolio, data, userId);

    // Pass full entity directly to repository
    return await this.portfolioRepository.update(id, updatedPortfolio);
}
```

### Step 5: Cleanup Unused Types

- Remove unused `*CreateDto` and `*UpdateDto` types where they're no longer needed
- Update generic type parameters throughout the codebase
- Clean up import statements

## TypeORM Create + Save Pattern Benefits

1. **Proper Entity Initialization**: `create()` ensures proper TypeORM entity setup
2. **Metadata Handling**: TypeORM can properly handle decorators and metadata
3. **Validation**: Entity-level validations are properly triggered
4. **Performance**: Optimized for TypeORM's internal mechanisms
5. **Consistency**: Same pattern for both create and update operations
6. **Transaction Safety**: Proper transaction handling built-in

## Entity/Persistence Interface Sharing

Since entities and persistence models share the same interface:

- **No Mapping Required**: Direct entity-to-persistence assignment
- **Type Safety**: Full compile-time type checking
- **Reduced Complexity**: Eliminates mapping layer entirely
- **Performance**: No object transformation overhead

## Benefits

1. **Type Safety**: Full entity types ensure correct data mapping
2. **Domain Consistency**: All operations go through domain entities
3. **Reduced Boilerplate**: Eliminate manual field extraction completely
4. **Maintainability**: Single source of truth for entity structure
5. **Simplified Architecture**: Remove mapping layer complexity
6. **TypeORM Integration**: Leverage ORM's built-in capabilities
7. **Consistent Patterns**: Create and update follow same pattern
8. **Proper TypeORM Usage**: Use `create()` before `save()` as recommended

## Current Create Pattern Analysis

### Before (Current State):

```typescript
// Command Handler
const { success, data, error } = TokenCreateSchema.safeParse(dto);
const token = Token.create(data, userId);
const tokenId = await this.tokenRepository.add(token); // ❌ Repository expects DTO but gets entity

// Repository
async add(data: AddTokenDto): Promise<Id> {
    const tokenEntity = this.tokenRepository.create(data); // ❌ Manual mapping
    const saved = await this.tokenRepository.save(tokenEntity);
    return saved.id;
}
```

### After (Proposed State):

```typescript
// Command Handler
const { success, data, error } = TokenCreateSchema.safeParse(dto);
const token = Token.create(data, userId);
return await this.tokenRepository.add(token); // ✅ Repository accepts full entity

// Repository
async add(entity: Token): Promise<Id> {
    const persistenceInstance = this.tokenRepository.create(entity); // ✅ Proper TypeORM pattern
    const saved = await this.tokenRepository.save(persistenceInstance); // ✅ Direct save
    return saved.id;
}
```

## Migration Strategy

Since this is a breaking change, the migration must be completed in a single coordinated effort:

1. **Preparation Phase**: Ensure all tests are passing and create backup
2. **Core Updates**: Update interfaces and base implementations
3. **Module Updates**: Update all modules simultaneously (create and update commands)
4. **Testing Phase**: Run full test suite and fix any issues
5. **Validation**: Verify all functionality works as expected

## Timeline Estimate

- **Step 1 (Core Interface)**: 1 hour
- **Step 2-3 (Repository Updates)**: 4-5 hours (increased due to both create and update)
- **Step 4 (Command Handlers)**: 3-4 hours (both create and update commands)
- **Step 5 (Cleanup & Testing)**: 2-3 hours (more cleanup needed)
- **Total**: 10-13 hours

## Risk Mitigation

1. **Backup**: Create branch backup before starting
2. **Incremental Testing**: Test each module after updates
3. **Rollback Plan**: Keep ability to revert changes quickly
4. **Documentation**: Update any architectural documentation
5. **Staged Approach**: Update one module completely before moving to next

## Next Steps

1. ✅ Plan approved for Option B implementation (create + update)
2. Implement Step 1 (Core Interface Updates)
3. Implement Step 2-3 (Repository Updates)
4. Implement Step 4 (Command Handler Updates - both create and update)
5. Complete Step 5 (Cleanup and Testing)
