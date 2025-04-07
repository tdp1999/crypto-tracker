import { z } from 'zod';
import { IdSchema, TimestampSchema } from './common.schema';

export const AuditableSchema = z.object({
    createdAt: TimestampSchema,
    createdById: IdSchema,

    updatedAt: TimestampSchema,
    updatedById: IdSchema,

    deletedAt: TimestampSchema.nullable().optional(),
    deletedById: IdSchema.nullable().optional(),
});
