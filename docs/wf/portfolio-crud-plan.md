# Portfolio CRUD Module Implementation Plan

**Generated**: 23 May 2025  
**Phase**: Phase 2 (Asset Management) - Portfolio Implementation  
**Target Module**: `src/modules/portfolio/` (standalone module)  
**Architecture**: Hexagonal Architecture + CQRS + Clean Architecture

---

## 1. Overview

This plan outlines the implementation of Portfolio CRUD functionality following the established project patterns:

- **Hexagonal Architecture**: Ports & Adapters pattern
- **CQRS**: Separated Command and Query responsibilities
- **Clean Architecture**: Domain entities in core, application use cases, infrastructure adapters
- **Existing Conventions**: Following user/auth module patterns for consistency

### Module Structure Decision

Portfolio is implemented as a **standalone module** that is decoupled from other modules:

- Portfolio management (this plan)
- Asset management (separate independent module)
- Decoupling via ID references (portfolioId in assets)

---

## 2. Domain Analysis

### Portfolio Entity Requirements

- **Core Properties**: `id`, `name`, `description`, `userId` (owner)
- **Business Rules**:
    - Each user can have multiple portfolios
    - Portfolio names must be unique per user
    - Default portfolios: "Main Portfolio" (auto-created on first use)
    - Soft deletion support
- **Relationships**: Portfolio → User (belongs to), Assets reference Portfolio via portfolioId (loose coupling)

### Use Cases (CQRS Operations)

**Commands (Write Operations)**:

- Create Portfolio
- Update Portfolio
- Delete Portfolio (soft delete)

**Queries (Read Operations)**:

- List User Portfolios (paginated)
- Get Portfolio Details
- Check Portfolio Ownership/Access

---

## 3. Folder Structure

Following the established pattern from `user` and `auth` modules:

```
src/modules/portfolio/
├── portfolio.module.ts                        # Standalone PortfolioModule
├── application/
│   ├── commands/
│   │   ├── create-portfolio.command.ts
│   │   ├── update-portfolio.command.ts
│   │   └── delete-portfolio.command.ts
│   ├── queries/
│   │   ├── list-portfolio.query.ts
│   │   ├── detail-portfolio.query.ts
│   │   └── portfolio-ownership.query.ts
│   ├── ports/
│   │   └── portfolio-repository.out.port.ts
│   ├── portfolio.dto.ts
│   └── portfolio.token.ts
└── infrastructure/
    ├── portfolio.controller.ts
    ├── portfolio.repository.ts
    ├── portfolio.persistence.ts
    └── migrations/
        └── YYYYMMDD-CreatePortfolioTable.ts
```

---

## 4. Core Domain Entity

### Location: `src/core/features/portfolio/portfolio.entity.ts`

Following the `User` entity pattern:

```typescript
// Core interfaces and schemas
export interface IPortfolio {
    id: Id;
    name: string;
    description?: string;
    userId: Id;
    isDefault: boolean;
    // Audit fields from AuditableSchema
    createdAt: Date;
    createdById: Id;
    updatedAt: Date;
    updatedById: Id;
    deletedAt?: Date;
    deletedById?: Id;
}

export const PortfolioSchema = z.object({
    id: IdSchema,
    name: z.string().min(1).max(255),
    description: z.string().max(1000).optional(),
    userId: IdSchema,
    isDefault: z.boolean().default(false),
    ...AuditableSchema.shape,
});

export const PortfolioCreateSchema = PortfolioSchema.pick({
    name: true,
    description: true,
    isDefault: true,
});

export const PortfolioUpdateSchema = PortfolioSchema.omit({ id: true, userId: true })
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
        message: ERR_COMMON_EMPTY_PAYLOAD,
    });

// Domain entity class
export class Portfolio extends BaseModel implements IPortfolio {
    // Implementation following User entity pattern
}
```

---

## 5. Application Layer

### 5.1 DTOs (`portfolio.dto.ts`)

Following `user.dto.ts` pattern:

```typescript
export const visibleColumns = ['id', 'name', 'description', 'userId', 'isDefault', 'createdAt', 'updatedAt'] as const;

export const PortfolioQuerySchema = createEntityQuerySchema(
    visibleColumns,
    PortfolioSchema.pick({
        name: true,
        userId: true,
        isDefault: true,
    }).shape,
);

export const PortfolioDeleteSchema = DetailQuerySchema;

// DTOs
export type PortfolioQueryDto = z.infer<typeof PortfolioQuerySchema>;
export type PortfolioCreateDto = z.infer<typeof PortfolioCreateSchema>;
export type PortfolioUpdateDto = z.infer<typeof PortfolioUpdateSchema>;
export type PortfolioDeleteDto = z.infer<typeof PortfolioDeleteSchema>;
```

### 5.2 Tokens (`portfolio.token.ts`)

Following `user.token.ts` pattern:

```typescript
export const PORTFOLIO_TOKENS = {
    REPOSITORIES: Symbol('PORTFOLIO.REPOSITORY'),

    HANDLERS: {
        QUERY: {
            LIST: Symbol('PORTFOLIO.QUERY.LIST'),
            DETAIL: Symbol('PORTFOLIO.QUERY.DETAIL'),
            OWNERSHIP: Symbol('PORTFOLIO.QUERY.OWNERSHIP'),
        },
        COMMAND: {
            CREATE: Symbol('PORTFOLIO.COMMAND.CREATE'),
            UPDATE: Symbol('PORTFOLIO.COMMAND.UPDATE'),
            DELETE: Symbol('PORTFOLIO.COMMAND.DELETE'),
        },
    },
};
```

### 5.3 Commands

**Create Portfolio Command** (`create-portfolio.command.ts`):

- **Input**: `{ dto: PortfolioCreateDto, userId: Id }`
- **Business Logic**:
    - Validate input with `PortfolioCreateSchema`
    - Check name uniqueness per user
    - Auto-set `isDefault: true` if user has no portfolios
    - Create Portfolio domain entity
- **Output**: `Id` (portfolio ID)

**Update Portfolio Command** (`update-portfolio.command.ts`):

- **Input**: `{ id: Id, dto: PortfolioUpdateDto, userId: Id }`
- **Business Logic**:
    - Validate ownership (portfolio belongs to user)
    - Validate input with `PortfolioUpdateSchema`
    - Check name uniqueness if name is being updated
    - Prevent unsetting `isDefault` if it's the only portfolio
- **Output**: `boolean` (success)

**Delete Portfolio Command** (`delete-portfolio.command.ts`):

- **Input**: `{ id: Id, userId: Id }`
- **Business Logic**:
    - Validate ownership
    - Prevent deletion of default portfolio if assets exist (check via Asset module API)
    - Soft delete implementation
- **Output**: `boolean` (success)

### 5.4 Queries

**List Portfolio Query** (`list-portfolio.query.ts`):

- **Input**: `{ dto: PortfolioQueryDto, userId: Id }`
- **Filter**: Auto-filter by `userId` for security
- **Output**: `PaginatedResponse<Portfolio>`

**Detail Portfolio Query** (`detail-portfolio.query.ts`):

- **Input**: `{ id: Id, userId: Id }`
- **Validation**: Check ownership before returning data
- **Output**: `Portfolio | null`

**Portfolio Ownership Query** (`portfolio-ownership.query.ts`):

- **Input**: `{ portfolioId: Id, userId: Id }`
- **Purpose**: Reusable ownership validation for other modules (Asset module can use this)
- **Output**: `boolean`

### 5.5 Ports

**Portfolio Repository Port** (`portfolio-repository.out.port.ts`):

```typescript
export type IPortfolioRepository = IRepository<Portfolio, PortfolioQueryDto, PortfolioCreateDto, PortfolioUpdateDto> & {
    findByUserAndName(userId: Id, name: string): Promise<Portfolio | null>;
    countByUserId(userId: Id): Promise<number>;
    findDefaultByUserId(userId: Id): Promise<Portfolio | null>;
};
```

---

## 6. Infrastructure Layer

### 6.1 Persistence Entity (`portfolio.persistence.ts`)

Following `user.persistence.ts` pattern:

```typescript
@Entity('portfolios')
export class PortfolioEntity extends BasePersistence implements IPortfolio {
    @Column()
    name: string;

    @Column({ nullable: true })
    description?: string;

    @Column()
    userId: string;

    @Column({ default: false })
    isDefault: boolean;

    // Note: No direct relationships to assets - decoupled via portfolioId reference
}
```

### 6.2 Repository Implementation (`portfolio.repository.ts`)

Following `user.repository.ts` pattern with TypeORM:

```typescript
@Injectable()
export class PortfolioRepository implements IPortfolioRepository {
    constructor(
        @InjectRepository(PortfolioEntity)
        private readonly portfolioRepo: Repository<PortfolioEntity>,
    ) {}

    // Implement all IRepository methods
    // + Additional methods: findByUserAndName, countByUserId, findDefaultByUserId
}
```

### 6.3 REST Controller (`portfolio.controller.ts`)

Following `user.controller.ts` pattern:

```typescript
@Controller('portfolios')
export class PortfolioController {
    constructor(
        private readonly commandBus: CommandBus,
        private readonly queryBus: QueryBus,
    ) {}

    @Post()
    async create(@Body() body: PortfolioCreateDto, @Requester() user: IUser): Promise<Id> {
        return await this.commandBus.execute(new CreatePortfolioCommand({ dto: body, userId: user.id }));
    }

    @Put(':id')
    async update(
        @Param('id') id: string,
        @Body() body: PortfolioUpdateDto,
        @Requester() user: IUser,
    ): Promise<boolean> {
        return await this.commandBus.execute(new UpdatePortfolioCommand({ id, dto: body, userId: user.id }));
    }

    @Delete(':id')
    async remove(@Param('id') id: string, @Requester() user: IUser): Promise<boolean> {
        return await this.commandBus.execute(new DeletePortfolioCommand({ id, userId: user.id }));
    }

    @Get()
    async list(@Query() query: PortfolioQueryDto, @Requester() user: IUser): Promise<PaginatedResponse<Portfolio>> {
        return await this.queryBus.execute(
            new PortfolioListQuery({ dto: { ...query, userId: user.id }, userId: user.id }),
        );
    }

    @Get(':id')
    async findById(@Param('id') id: string, @Requester() user: IUser): Promise<Portfolio> {
        return await this.queryBus.execute(new PortfolioDetailQuery({ id, userId: user.id }));
    }
}
```

---

## 7. Module Configuration

### Portfolio Module (`portfolio.module.ts`)

```typescript
const PortfolioCommandHandlers = [
    CreatePortfolioCommandHandler,
    UpdatePortfolioCommandHandler,
    DeletePortfolioCommandHandler,
];

const PortfolioQueryHandlers = [ListPortfolioQueryHandler, DetailPortfolioQueryHandler, PortfolioOwnershipQueryHandler];

@Module({
    controllers: [PortfolioController],
    imports: [TypeOrmModule.forFeature([PortfolioEntity]), CqrsModule],
    providers: [
        {
            provide: PORTFOLIO_TOKENS.REPOSITORIES,
            useClass: PortfolioRepository,
        },
        ...PortfolioCommandHandlers,
        ...PortfolioQueryHandlers,
    ],
    exports: [
        // Export portfolio ownership query for Asset module to use
        PortfolioOwnershipQueryHandler,
        PORTFOLIO_TOKENS.REPOSITORIES,
    ],
})
export class PortfolioModule {}
```

---

## 8. API Endpoints Design

### RESTful Portfolio Endpoints

| Method   | Endpoint          | Description           | Input                | Output                         |
| -------- | ----------------- | --------------------- | -------------------- | ------------------------------ |
| `POST`   | `/portfolios`     | Create portfolio      | `PortfolioCreateDto` | `{ id: string }`               |
| `GET`    | `/portfolios`     | List user portfolios  | Query params         | `PaginatedResponse<Portfolio>` |
| `GET`    | `/portfolios/:id` | Get portfolio details | Portfolio ID         | `Portfolio`                    |
| `PUT`    | `/portfolios/:id` | Update portfolio      | `PortfolioUpdateDto` | `{ success: boolean }`         |
| `DELETE` | `/portfolios/:id` | Delete portfolio      | Portfolio ID         | `{ success: boolean }`         |

### Security Considerations

- All endpoints require authentication (`@Requester()` decorator)
- Automatic user-scoping (users can only access their own portfolios)
- Ownership validation in queries and commands
- Input validation with Zod schemas

---

## 9. Database Migration

### Migration File: `src/modules/portfolio/infrastructure/migrations/YYYYMMDD-CreatePortfolioTable.ts`

```sql
CREATE TABLE portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  user_id UUID NOT NULL REFERENCES users(id),
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by_id UUID NOT NULL REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by_id UUID NOT NULL REFERENCES users(id),
  deleted_at TIMESTAMP,
  deleted_by_id UUID REFERENCES users(id),

  UNIQUE(user_id, name) WHERE deleted_at IS NULL
);

CREATE INDEX idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX idx_portfolios_is_default ON portfolios(user_id, is_default);
```

---

## 10. Error Handling

### Portfolio-specific Errors (`src/core/features/portfolio/portfolio.error.ts`)

```typescript
export const ERR_PORTFOLIO_NAME_EXISTS = 'Portfolio name already exists';
export const ERR_PORTFOLIO_NOT_FOUND = 'Portfolio not found';
export const ERR_PORTFOLIO_ACCESS_DENIED = 'Access denied to portfolio';
export const ERR_PORTFOLIO_CANNOT_DELETE_DEFAULT = 'Cannot delete default portfolio with assets';
export const ERR_PORTFOLIO_CANNOT_UNSET_DEFAULT = "Cannot unset default when it's the only portfolio";
```

---

## 11. Testing Strategy

### Unit Tests Structure

```
src/modules/portfolio/
├── __tests__/
│   ├── commands/
│   │   ├── create-portfolio.command.spec.ts
│   │   ├── update-portfolio.command.spec.ts
│   │   └── delete-portfolio.command.spec.ts
│   ├── queries/
│   │   ├── list-portfolio.query.spec.ts
│   │   └── detail-portfolio.query.spec.ts
│   ├── portfolio.repository.spec.ts
│   └── portfolio.controller.spec.ts
```

### Test Cases Coverage

- **Commands**: Valid inputs, business rule violations, ownership validation
- **Queries**: Data filtering, pagination, access control
- **Repository**: CRUD operations, custom queries
- **Controller**: HTTP endpoints, authentication integration

---

## 12. Integration Points

### Current Integration

- **UserModule**: Portfolio ownership via `userId` foreign key
- **AuthModule**: Authentication required for all endpoints

### Future Integration (Decoupled)

- **AssetModule**: Assets will reference portfolios via `portfolioId` (loose coupling)
- **TransactionModule**: Transactions will reference portfolios via `portfolioId`
- **ReportsModule**: Portfolio-based reporting via ID references

### Decoupling Strategy

- No direct TypeORM relationships between modules
- Communication via ID references and API calls when needed
- Portfolio ownership validation exposed as exported service for other modules

---

## 13. Implementation Phases

### Phase 1: Core Setup ✅ (This Plan)

- [x] Domain entity and schemas
- [x] Application layer (commands, queries, DTOs)
- [x] Infrastructure layer (persistence, repository, controller)
- [x] Module configuration and dependency injection

### Phase 2: Testing & Validation

- [ ] Unit tests for all layers
- [ ] Integration tests for API endpoints
- [ ] Database migration testing

### Phase 3: Enhancement

- [ ] Default portfolio auto-creation on user registration
- [ ] Portfolio templates/presets
- [ ] Portfolio sharing/collaboration (future)

---

## 14. Checklist for Implementation

### Domain Layer

- [ ] Create `src/core/features/portfolio/portfolio.entity.ts`
- [ ] Create `src/core/features/portfolio/portfolio.error.ts`
- [ ] Add portfolio entity to TypeORM configuration

### Application Layer

- [ ] Create `portfolio.dto.ts` with all DTO types
- [ ] Create `portfolio.token.ts` with dependency injection tokens
- [ ] Implement all command handlers (create, update, delete)
- [ ] Implement all query handlers (list, detail, ownership)
- [ ] Create repository port interface

### Infrastructure Layer

- [ ] Create `portfolio.persistence.ts` with TypeORM entity
- [ ] Implement `portfolio.repository.ts` with all methods
- [ ] Create `portfolio.controller.ts` with REST endpoints
- [ ] Create database migration file

### Module Integration

- [ ] Create `portfolio.module.ts` with proper DI configuration
- [ ] Register PortfolioModule in main AppModule
- [ ] Add portfolio routes to API documentation

### Testing

- [ ] Create unit tests for all handlers
- [ ] Create repository tests
- [ ] Create controller integration tests
- [ ] Verify API endpoints with Postman/testing tools

---

**Approval Required**: Please review this plan before implementation begins.  
**Estimated Implementation Time**: 2-3 days  
**Dependencies**: None (User/Auth modules already completed)
