import { createEntityQuerySchema } from '@core/factories/query.factory';
import { DetailQuerySchema } from '@core/schema/query.schema';
import { z } from 'zod';
import { PortfolioSchema } from '../domain/portfolio.entity';

export const visibleColumns = ['id', 'name', 'description', 'userId', 'isDefault', 'createdAt', 'updatedAt'] as const;

export const PortfolioQuerySchema = createEntityQuerySchema(
    visibleColumns,
    PortfolioSchema.pick({ name: true, userId: true, isDefault: true }).shape,
);

export const PortfolioDeleteSchema = DetailQuerySchema;

/* DTOs */
export type PortfolioQueryDto = z.infer<typeof PortfolioQuerySchema>;
