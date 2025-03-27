Ta có một một số rule về folder structure như sau:

1. Folder structure chính gồm 3 folder: core, modules, share
2. Core: là nơi chứa tất cả những LOGIC sử dụng chung cho toàn system (cross cutting features), có dính dáng nhiều đến domain logic
3. Share
    - là nơi chứa những logic có thể reusable.
    - Share không được import từ core, chỉ cho phép ngược lại
    - Phải kiểm tra kỹ, và hạn chế hết mức dependency circular
4. Modules: 1 application DDD kết hợp với hexagonal thường sẽ chia làm 3 layer:
    - Domain: nơi chứa model, error, event (model event),value object và nếu có, aggregate
    - Application: nơi chứa các use case (CQRS), các dto và các ports/interfaces (cả primary và secondary ports)
    - infrastructure: nơi chứa tất cả những adapters
5.

```text
.
├── core/
│   ├── domain/
│   │   ├── entities
│   │   └── value-objects
│   ├── features/
│   │   ├── authenticate/
│   │   ├── authorize/
│   │   ├── permission/
│   │   └── seed/
│   ├── configs/
│   │   └── database.config.ts
│   ├── abstractions/
│   ├── interfaces/
│   ├── models/
│   ├── actions/
│   ├── dtos/
|   ├── errors/
│   ├── builders/
│   ├── filters/
│   └── interceptors/
├── modules/
│   └── order/
│       ├── application/
│       │   ├── ports/
│       │   │   ├── order-service.in.port.ts
│       │   │   └── payment.gateway.out.port.ts
│       │   ├── commands/
│       │   │   └── create-order.command.ts
│       │   ├── queries/
│       │   │   └── get-order.query.ts
│       │   └── dtos/
│       │       ├── update-order.command.dto.ts
│       │       └── order.query.dto.ts
│       ├── domain/
│       │   ├── aggregates/
│       │   │   ├── order.aggregate.ts
│       │   │   └── cart.aggregate.ts
│       │   ├── entities/
│       │   │   ├── order.entity.ts
│       │   │   └── order-item.entity.ts
│       │   ├── value-objects/
│       │   │   └── shipping-address.vo.ts
|       |   |── types/
│       │   │   └── order-type.enum.ts
│       │   ├── errors/  // Only store separate error message inside domain. Infras or application can directly write
│       │   │   └── order.error.ts
│       │   ├── services/
│       │   │   └── order.domain-service.ts
│       │   └── events/
│       │       └── order-created.event.ts
│       └── infrastructure/
│           ├── persistence/
│           │   ├── order.persistence.ts
│           │   └── migrations/
│           │       └── 1730101884839-CreateBrandTable.ts
│           ├── controller/
│           │   └── order.controller.ts
│           ├── rpc/
│           │   └── order.rpc.ts
│           └── adapters/
│               ├── email.adapter.ts
│               └── jwt.adapter.ts
└── share/
    ├── cache/
    ├── constants/
    ├── types/
    ├── decorators/
    ├── modules/
    ├── tokens/
    ├── utils/
    └── vos/
```
