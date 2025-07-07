// FLAG: PENDING VERIFICATION
import { createEntityQuerySchema } from '@core/factories/query.factory';
import { z } from 'zod';
import { TransactionSchema } from '../domain/entities/transaction.entity';

export const visibleTransactionColumns = [
    'id',
    'portfolioId',
    'refId',
    'tokenSymbol',
    'tokenName',
    'amount',
    'price',
    'type',
    'cashFlow',
    'fees',
    'timestamp',
    'externalId',
    'notes',
    'createdAt',
    'updatedAt',
] as const;

export const TransactionQuerySchema = createEntityQuerySchema(
    visibleTransactionColumns,
    TransactionSchema.pick({
        portfolioId: true,
        refId: true,
        tokenSymbol: true,
        type: true,
        timestamp: true,
        externalId: true,
    }).shape,
);

/* DTOs */
export type TransactionQueryDto = z.infer<typeof TransactionQuerySchema>;
