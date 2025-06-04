import { z } from 'zod';

export enum DataSource {
    COINGECKO = 'coingecko',
}

export const ProviderAssetSchema = z.object({
    id: z.string(),
    symbol: z.string(),
    name: z.string(),
    logo: z.string().optional(),
    image: z.string().optional(),
    dataSource: z.nativeEnum(DataSource),
});

export const ProviderPriceSchema = z.object({
    id: z.string(),
    price: z.number(),
    marketCap: z.number(),
    volumn24h: z.number(),
    percentChange24h: z.number(),
    lastUpdated: z.string(),
    dataSource: z.nativeEnum(DataSource),
});

export const ProviderDetailsSchema = z.object({
    // General
    id: z.string(),
    name: z.string(),
    symbol: z.string(),
    categories: z.array(z.string()),
    logo: z.string(),
    dataSource: z.nativeEnum(DataSource),

    // Details
    country_origin: z.string().optional(),
    description: z.string().optional(),
    genesis_date: z.string().optional(),

    // Market data
    price: z.number(),
    marketCap: z.number(),
    volumn24h: z.number(),
    percentChange24h: z.number(),
    lastUpdated: z.string(),
});

export type IProviderAsset = z.infer<typeof ProviderAssetSchema>;
export type IProviderPrice = z.infer<typeof ProviderPriceSchema>;
export type IProviderDetails = z.infer<typeof ProviderDetailsSchema>;
