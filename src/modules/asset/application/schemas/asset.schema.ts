import { ERR_COMMON_EMPTY_PAYLOAD } from '@core/errors/messages/common.error';
import { AuditableSchema } from '@core/schema/auditable.schema';
import { IdSchema } from '@core/schema/common.schema';
import z from 'zod';
import { AssetTypeEnum } from '../../domain/enums/asset.enum';

export const AssetSchema = z.object({
    id: IdSchema,
    userId: IdSchema,
    name: z.string().min(1).max(255),
    currentValue: z.number().nonnegative().default(0),
    type: z.nativeEnum(AssetTypeEnum),
    location: z.string().max(255).optional().nullable(),
    description: z.string().max(1000).optional().nullable(),
    target: z.unknown().optional().nullable(),
    ...AuditableSchema.shape,
});

export const AssetCreateSchema = AssetSchema.pick({
    name: true,
    currentValue: true,
    type: true,
    location: true,
    description: true,
    target: true,
});

export const AssetUpdateSchema = AssetSchema.omit({ id: true, userId: true })
    .partial()
    .refine((data) => Object.keys(data).length > 0, { message: ERR_COMMON_EMPTY_PAYLOAD });
