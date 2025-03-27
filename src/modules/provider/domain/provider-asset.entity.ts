import { z } from 'zod';

export const ProviderAssetSchema = z.object({
    id: z.string(),
    symbol: z.string(),
    name: z.string(),
    logo: z.string().optional(),
    image: z.string().optional(),
});

export const ProviderPriceSchema = z.object({
    id: z.string(),
    price: z.number(),
    marketCap: z.number(),
    volumn24h: z.number(),
    percentChange24h: z.number(),
    lastUpdated: z.bigint(),
});

export type IProviderAsset = z.infer<typeof ProviderAssetSchema>;
export type IProviderPrice = z.infer<typeof ProviderPriceSchema>;
