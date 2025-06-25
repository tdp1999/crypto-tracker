import { createEntityQuerySchema } from '@core/factories/query.factory';
import { z } from 'zod';
import { PortfolioSchema } from '../domain/entities/portfolio.entity';

export const visibleColumns = ['id', 'name', 'description', 'userId', 'isDefault', 'createdAt', 'updatedAt'] as const;

export const PortfolioQuerySchema = createEntityQuerySchema(
    visibleColumns,
    PortfolioSchema.pick({ name: true, userId: true, isDefault: true }).shape,
);

/* DTOs */
// I have to leave it here because it's used in the repository, type's generic and stuffs.
// Otherwise, I just put it inside the list query.
export type PortfolioQueryDto = z.infer<typeof PortfolioQuerySchema>;
