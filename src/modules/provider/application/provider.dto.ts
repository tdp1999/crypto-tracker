import { QuerySchema } from '@core/schema/query.schema';
import { z } from 'zod';

export const ProviderQuerySchema = QuerySchema.pick({ key: true })
    .required()
    .refine(
        (data) => {
            if (!data.key) return false;
            return data.key.trim() !== '';
        },
        {
            message: 'Key must be a non-empty string',
            path: ['key'],
        },
    );

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

export const ProviderDetailsQuerySchema = z.object({ id: z.string() });

export type ProviderQuery = z.infer<typeof ProviderQuerySchema>;
export type ProviderPriceQuery = z.infer<typeof ProviderPriceQuerySchema>;
export type ProviderDetailsQuery = z.infer<typeof ProviderDetailsQuerySchema>;
