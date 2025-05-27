import { createEntityQuerySchema } from '@core/factories/query.factory';
import { PortfolioCreateSchema, PortfolioSchema, PortfolioUpdateSchema } from '../domain/portfolio.entity';
import { DetailQuerySchema } from '@core/schema/query.schema';
import { z } from 'zod';

export const visibleColumns = ['id', 'name', 'description', 'userId', 'isDefault', 'createdAt', 'updatedAt'] as const;

export const PortfolioQuerySchema = createEntityQuerySchema(
    visibleColumns,
    PortfolioSchema.pick({ name: true, userId: true, isDefault: true }).shape,
);

export const PortfolioDeleteSchema = DetailQuerySchema;

/* DTOs */
export type PortfolioQueryDto = z.infer<typeof PortfolioQuerySchema>;
export type PortfolioCreateDto = z.infer<typeof PortfolioCreateSchema>;
export type PortfolioUpdateDto = z.infer<typeof PortfolioUpdateSchema>;
export type PortfolioDeleteDto = z.infer<typeof PortfolioDeleteSchema>;
