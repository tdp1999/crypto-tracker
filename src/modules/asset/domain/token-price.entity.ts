import { BadRequestError } from '@core/errors/domain.error';
import { ErrorLayer } from '@core/errors/types/error-layer.type.error';
import { IdSchema } from '@core/schema/common.schema';
import { Id } from '@core/types/common.type';
import { TemporalValue } from '@shared/vos/temporal.value';
import { z } from 'zod';

export const TokenPriceSchema = z.object({
    tokenId: IdSchema,
    priceUsd: z.number().positive(),
    marketCap: z.number().positive().optional(),
    volume24h: z.number().positive().optional(),
    priceChange24h: z.number().optional(),
    lastUpdated: z.bigint(),
    dataSource: z.string().min(1).max(50).default('coingecko'),
    createdAt: z.bigint(),
    updatedAt: z.bigint(),
});

export const TokenPriceCreateSchema = TokenPriceSchema.pick({
    tokenId: true,
    priceUsd: true,
    marketCap: true,
    volume24h: true,
    priceChange24h: true,
    dataSource: true,
});

export const TokenPriceUpdateSchema = TokenPriceSchema.omit({ tokenId: true, createdAt: true })
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
        message: 'Update payload cannot be empty',
    });

export type ITokenPrice = z.infer<typeof TokenPriceSchema>;

export class TokenPrice implements ITokenPrice {
    readonly tokenId: Id;
    readonly priceUsd: number;
    readonly marketCap?: number;
    readonly volume24h?: number;
    readonly priceChange24h?: number;
    readonly lastUpdated: bigint;
    readonly dataSource: string;
    readonly createdAt: bigint;
    readonly updatedAt: bigint;

    private constructor(props: ITokenPrice) {
        Object.assign(this, props);
    }

    static create(raw: Partial<ITokenPrice>): TokenPrice {
        const { success, data, error } = TokenPriceCreateSchema.safeParse(raw);
        if (!success)
            throw BadRequestError(error, { layer: ErrorLayer.DOMAIN, remarks: 'Token price creation failed' });

        const now = TemporalValue.now;

        return new TokenPrice({
            ...data,
            lastUpdated: now,
            createdAt: now,
            updatedAt: now,
        });
    }

    static update(existing: ITokenPrice, raw: Partial<ITokenPrice>): TokenPrice {
        const now = TemporalValue.now;
        const newData = {
            ...existing,
            ...raw,
            lastUpdated: now,
            updatedAt: now,
        };
        const { success, error } = TokenPriceUpdateSchema.safeParse(raw);
        if (!success) throw BadRequestError(error, { layer: ErrorLayer.DOMAIN, remarks: 'Token price update failed' });

        return new TokenPrice(newData);
    }

    // Business logic methods
    isStale(maxAgeMinutes: number = 5): boolean {
        const maxAgeMs = maxAgeMinutes * 60 * 1000;
        const ageMs = Number(TemporalValue.now - this.lastUpdated);
        return ageMs > maxAgeMs;
    }

    getPriceChangeDirection(): 'up' | 'down' | 'neutral' {
        if (!this.priceChange24h) return 'neutral';
        if (this.priceChange24h > 0) return 'up';
        if (this.priceChange24h < 0) return 'down';
        return 'neutral';
    }

    formatPriceChange(): string {
        if (!this.priceChange24h) return '0.00%';
        const sign = this.priceChange24h >= 0 ? '+' : '';
        return `${sign}${this.priceChange24h.toFixed(2)}%`;
    }
}
