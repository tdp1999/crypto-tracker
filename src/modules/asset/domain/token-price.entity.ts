import { IdentifierValue } from '@shared/vos/identifier.value';
import { BaseModel } from '@core/abstractions/model.base';
import { BadRequestError } from '@core/errors/domain.error';
import { ERR_COMMON_EMPTY_PAYLOAD } from '@core/errors/messages/common.error';
import { ErrorLayer } from '@core/errors/types/error-layer.type.error';
import { AuditableSchema } from '@core/schema/auditable.schema';
import { IdSchema } from '@core/schema/common.schema';
import { Id } from '@core/types/common.type';
import { z } from 'zod';

export const TokenPriceSchema = z.object({
    id: IdSchema, // Local UUID of the system, not related to any external provider
    tokenId: IdSchema, // Local UUID of the token, not related to any external provider
    refId: z.string().min(1).max(100), // Reference ID of the token
    priceUsd: z.number().positive(),
    marketCap: z.number().positive().optional(),
    volume24h: z.number().positive().optional(),
    priceChange24h: z.number().optional(),
    dataSource: z.string().min(1).max(50).optional(),
    ...AuditableSchema.shape,
});

export const TokenPriceCreateSchema = TokenPriceSchema.pick({
    refId: true,
    tokenId: true,
    priceUsd: true,
    marketCap: true,
    volume24h: true,
    priceChange24h: true,
    dataSource: true,
});

export const TokenPriceUpdateSchema = TokenPriceSchema.omit({ tokenId: true, refId: true, createdAt: true })
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
        message: ERR_COMMON_EMPTY_PAYLOAD,
    });

export type ITokenPrice = z.infer<typeof TokenPriceSchema>;
export type ITokenProviderPrice = {
    id: string;
    marketCap: number;
    price: number;
    volumn24h: number;
    percentChange24h: number;
    lastUpdated: string;
    dataSource: string;
};

export class TokenPrice extends BaseModel implements ITokenPrice {
    readonly tokenId: Id;
    readonly refId: string;
    readonly priceUsd: number;
    readonly marketCap?: number;
    readonly volume24h?: number;
    readonly priceChange24h?: number;
    readonly dataSource?: string;

    private constructor(props: Partial<ITokenPrice>) {
        super(props);
        Object.assign(this, props);
    }

    static create(raw: Partial<ITokenPrice>, createdById: Id): TokenPrice {
        const { success, data, error } = TokenPriceCreateSchema.safeParse(raw);
        if (!success)
            throw BadRequestError(error, { layer: ErrorLayer.DOMAIN, remarks: 'Token price creation failed' });

        return new TokenPrice({
            ...data,
            id: IdentifierValue.v7(),
            createdById,
            updatedById: createdById,
        });
    }

    static update(existing: ITokenPrice, raw: Partial<ITokenPrice>, updatedById: Id): TokenPrice {
        const newData = {
            ...existing,
            ...raw,
            updatedById,
        };
        const { success, error } = TokenPriceUpdateSchema.safeParse(raw);
        if (!success) throw BadRequestError(error, { layer: ErrorLayer.DOMAIN, remarks: 'Token price update failed' });

        return new TokenPrice(newData);
    }

    static fromPersistence(raw: ITokenPrice): TokenPrice {
        return new TokenPrice(raw);
    }

    // Convert function, used for RPC calls
    static fromProviderPrice(raw: ITokenProviderPrice): Partial<ITokenPrice> {
        return {
            refId: raw.id,
            priceUsd: raw.price,
            marketCap: raw.marketCap,
            volume24h: raw.volumn24h,
            priceChange24h: raw.percentChange24h,
            dataSource: raw.dataSource,
        };
    }

    // Business logic methods
    isStale(maxAgeMinutes: number = 5): boolean {
        const maxAgeMs = maxAgeMinutes * 60 * 1000;
        const now = new Date();
        const lastUpdate = new Date(this.updatedAt);
        const ageMs = now.getTime() - lastUpdate.getTime();
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
