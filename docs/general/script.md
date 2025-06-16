# Create a migration diff file

`pnpm run migration:generate src/modules/user/infrastructure/migrations/UpdateConstrainInUserTables --dr`

# Run migration

`pnpm run migrate`

# Revert migration

`pnpm run migrate:revert`

# Run seed

`pnpm run seed`
