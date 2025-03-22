import { z } from 'zod';

export const ProviderAssetSchema = z.object({
    id: z.string(),
    symbol: z.string(),
    name: z.string(),
});

export type IProviderAsset = z.infer<typeof ProviderAssetSchema>;
