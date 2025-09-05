import z from 'zod';
import { ERR_COMMON_EMPTY_PAYLOAD } from '@core/errors/messages/common.error';
import { AuditableSchema } from '@core/schema/auditable.schema';
import { IdSchema } from '@core/schema/common.schema';

export const AssetTargetSchema = z.object({
    id: IdSchema,
    assetId: IdSchema,
    targetValue: z.number().nonnegative(),
    ...AuditableSchema.shape,
});

export const AssetTargetCreateSchema = AssetTargetSchema.pick({ targetValue: true });

export const AssetTargetUpdateSchema = AssetTargetSchema.omit({ id: true, assetId: true })
    .partial()
    .refine((data) => Object.keys(data).length > 0, { message: ERR_COMMON_EMPTY_PAYLOAD });
