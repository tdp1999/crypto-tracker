| **Action**                      | **Best Name**                           | **Alternative (If Needed)**                     |
|---------------------------------|-----------------------------------------|-------------------------------------------------|
| Get a single item (can be null) | `findById(id: UUID)`                    | `findByIdentifier(id: UUID)`                    |
| Get a single item (must exist)  | `getById(id: UUID)` (throws error)      | `getOrThrow(id: UUID)`                          |
| Check if an item exists         | `exists(id: UUID)`                      | `has(id: UUID)` (less common)                   |
| Get multiple items              | `list()` / `listByUserId(userId: UUID)` | `getAll()` (less preferred)                     |
| Create a new item               | `add(item: T)`                          | `create(item: T)`                               |
| Update an item                  | `update(id, data)`                      | `updateQuantity(id, qty)` (for specific fields) |
| Delete a single item            | `remove(id: UUID)`                      | `deleteById(id: UUID)`                          |
| Delete all user items           | `clear(userId: UUID)`                   | `clearCart(userId: UUID)`                       |

| **Method Name** | **Usage**                                                                                    |
|-----------------|----------------------------------------------------------------------------------------------|
| **find**        | Use when searching for one or multiple records (e.g., `findById`, `findByEmail`, `findAll`)  |
| **get**         | Use when retrieving something that should always exist (e.g., `getConfig`, `getCurrentUser`) |
| **list**        | Use when retrieving a collection of items (e.g., `listUsers`, `listOrders`)                  |
| **add**         | Use when adding a new entity (e.g., `addItemToCart`, `addUser`)                              |
| **remove**      | Use when deleting an entity (e.g., `removeItem`, `removeUser`)                               |
| **update**      | Use when modifying an existing entity (e.g., `updateUserProfile`, `updateOrderStatus`)       |
| **clear**       | Use when deleting multiple items at once (e.g., `clearCart`, `clearCache`)                   |
