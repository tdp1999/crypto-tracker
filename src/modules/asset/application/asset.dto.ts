import { createEntityQuerySchema } from '@core/factories/query.factory';
import { z } from 'zod';
import { AssetStatusEnum } from '../domain/enums/asset.enum';
import { AssetSchema } from './schemas/asset.schema';

export const visibleAssetColumns = [
    'id',
    'userId',
    'name',
    'currentValue',
    'type',
    'location',
    'description',
    'target',
    'createdAt',
    'updatedAt',
] as const;

export const AssetQuerySchema = createEntityQuerySchema(
    visibleAssetColumns,
    AssetSchema.pick({ userId: true, name: true, type: true }).shape,
);

export type AssetQueryDto = z.infer<typeof AssetQuerySchema>;

export const AssetDashboardItemSchema = z.object({
    id: AssetSchema.shape.id,
    name: AssetSchema.shape.name,
    currentValue: AssetSchema.shape.currentValue,
    type: AssetSchema.shape.type,
    proportion: z.number().min(0).max(1),
    progress: z.number().min(0).max(1).optional(),
    status: z.nativeEnum(AssetStatusEnum).optional(),
});

export const AssetDashboardSchema = z.object({
    totalValue: z.number().nonnegative(),
    overallProgress: z.number().min(0).max(1).optional(),
    items: z.array(AssetDashboardItemSchema),
});

export type AssetDashboardDto = z.infer<typeof AssetDashboardSchema>;
