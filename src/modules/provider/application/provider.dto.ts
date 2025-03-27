import { QuerySchema } from '@core/dtos/query.dto';
import { z } from 'zod';

export const ProviderQuerySchema = QuerySchema.pick({ key: true }).required();
export const ProviderPriceQuerySchema = z.array(z.string());

export type ProviderQuery = z.infer<typeof ProviderQuerySchema>;
export type ProviderPriceQuery = z.infer<typeof ProviderPriceQuerySchema>;
