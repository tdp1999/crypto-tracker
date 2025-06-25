import { createEntityQuerySchema } from '@core/factories/query.factory';
import { z } from 'zod';
import { PortfolioHoldingSchema } from '../domain/entities/portfolio-holding.entity';
import { PortfolioSchema } from '../domain/entities/portfolio.entity';

export const visibleColumns = ['id', 'name', 'description', 'userId', 'isDefault', 'createdAt', 'updatedAt'] as const;
export const visibleColumnsHolding = [
    'id',
    'portfolioId',
    'tokenSymbol',
    'isStablecoin',
    'createdAt',
    'updatedAt',
] as const;

export const PortfolioQuerySchema = createEntityQuerySchema(
    visibleColumns,
    PortfolioSchema.pick({ name: true, userId: true, isDefault: true }).shape,
);

export const PortfolioHoldingQuerySchema = createEntityQuerySchema(
    visibleColumnsHolding,
    PortfolioHoldingSchema.pick({ portfolioId: true, tokenSymbol: true, isStablecoin: true }).shape,
);

/* DTOs */
// I have to leave it here because it's used in the repository, type's generic and stuffs.
// Otherwise, I just put it inside the list query.
export type PortfolioQueryDto = z.infer<typeof PortfolioQuerySchema>;
export type PortfolioHoldingQueryDto = z.infer<typeof PortfolioHoldingQuerySchema>;
