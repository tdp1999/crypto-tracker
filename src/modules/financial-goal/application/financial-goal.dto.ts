import { createEntityQuerySchema } from '@core/factories/query.factory';
import { z } from 'zod';
import { FinancialGoalSchema } from './schema/financial-goal.schema';

export const visibleFinancialGoalColumns = [
    'id',
    'userId',
    'name',
    'targetDate',
    'isActive',
    'createdAt',
    'updatedAt',
] as const;

export const FinancialGoalQuerySchema = createEntityQuerySchema(
    visibleFinancialGoalColumns,
    FinancialGoalSchema.pick({ name: true, userId: true, isActive: true, targetDate: true }).shape,
);

export type FinancialGoalQueryDto = z.infer<typeof FinancialGoalQuerySchema>;
