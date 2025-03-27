import { QuerySchema } from '@core/dtos/query.dto';
import { z } from 'zod';

export const ProviderQuerySchema = QuerySchema.pick({ key: true }).required();
export const ProviderPriceQuerySchema = z.object({ ids: z.string() }).refine(
    (data) => {
        const ids = data.ids.split(',');

        if (ids.length === 0) return false;

        return ids.every((id) => id.trim() !== '');
    },
    {
        message: 'IDs must be comma-separated values with no empty items',
        path: ['ids'],
    },
);

export type ProviderQuery = z.infer<typeof ProviderQuerySchema>;
export type ProviderPriceQuery = z.infer<typeof ProviderPriceQuerySchema>;
