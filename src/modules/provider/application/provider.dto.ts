import { QuerySchema } from '@core/dtos/query.dto';
import { z } from 'zod';
import { ProviderAssetSchema } from '../domain/provider-asset.entity';

export const ProviderQuerySchema = QuerySchema.merge(ProviderAssetSchema.pick({ name: true, symbol: true }).partial());

export type ProviderQuery = z.infer<typeof ProviderQuerySchema>;
