import { createEntityQuerySchema } from '@core/factories/query.factory';
import { z } from 'zod';
import { TokenSchema } from '../domain/token.entity';

// Token Management DTOs
export const visibleColumns = [
    'id',
    'symbol',
    'name',
    'refId',
    'decimals',
    'isActive',
    'isStablecoin',
    'stablecoinPeg',
    'logoUrl',
    'createdAt',
    'updatedAt',
] as const;

export const TokenSearchSchema = createEntityQuerySchema(
    visibleColumns,
    TokenSchema.pick({ name: true, symbol: true, refId: true }).shape,
);

// Token Price DTOs
export const TokenPriceGetSchema = z.object({
    tokenId: z.string().uuid(),
});

// Query DTOs
export const GetTokenSchema = z.object({
    tokenId: z.string().uuid(),
});

// Type exports
export type SearchTokensDto = z.infer<typeof TokenSearchSchema>;
export type GetTokenPriceDto = z.infer<typeof TokenPriceGetSchema>;
export type GetTokenDto = z.infer<typeof GetTokenSchema>;

// Response DTOs
export interface TokenResponseDto {
    id: string;
    symbol: string;
    name: string;
    refId: string;
    decimals: number;
    isActive: boolean;
    isStablecoin: boolean;
    stablecoinPeg?: string;
    logoUrl?: string;
    createdAt: string;
    updatedAt: string;
}

export interface TokenPriceResponseDto {
    tokenId: string;
    priceUsd: number;
    marketCap?: number;
    volume24h?: number;
    priceChange24h?: number;
    lastUpdated: string;
    dataSource: string;
}

export interface TokenSearchResponseDto {
    tokens: TokenResponseDto[];
    total: number;
    limit: number;
}
