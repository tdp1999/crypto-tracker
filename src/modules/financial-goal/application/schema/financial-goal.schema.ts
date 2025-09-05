import z from 'zod';
import { ERR_COMMON_EMPTY_PAYLOAD } from '@core/errors/messages/common.error';
import { AuditableSchema } from '@core/schema/auditable.schema';
import { IdSchema } from '@core/schema/common.schema';

export const FinancialGoalSchema = z.object({
    id: IdSchema,
    userId: IdSchema,
    name: z.string().min(1).max(255),
    targetDate: z.string(),
    isActive: z.boolean().default(false),
    ...AuditableSchema.shape,
});

export const FinancialGoalCreateSchema = FinancialGoalSchema.pick({ name: true, targetDate: true });

export const FinancialGoalUpdateSchema = FinancialGoalCreateSchema.partial().refine(
    (data) => Object.keys(data).length > 0,
    {
        message: ERR_COMMON_EMPTY_PAYLOAD,
    },
);
