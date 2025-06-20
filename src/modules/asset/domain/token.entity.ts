import { BaseModel } from '@core/abstractions/model.base';
import { BadRequestError } from '@core/errors/domain.error';
import { ERR_COMMON_EMPTY_PAYLOAD } from '@core/errors/messages/common.error';
import { ErrorLayer } from '@core/errors/types/error-layer.type.error';
import { AuditableSchema } from '@core/schema/auditable.schema';
import { IdSchema } from '@core/schema/common.schema';
import { Id } from '@core/types/common.type';
import { IdentifierValue } from '@shared/vos/identifier.value';
import { z } from 'zod';

export const TokenSchema = z.object({
    id: IdSchema,
    symbol: z.string().min(1).max(20), // E.g: BTC, ETH, SOL, etc.
    name: z.string().min(1).max(100), // E.g: Bitcoin, Ethereum, Solana, etc.
    refId: z.string().min(1).max(100), // required - external API reference. E.g: bitcoin, ethereum, solana, etc.
    decimals: z.number().int().min(0).max(18).default(18),
    isActive: z.boolean().default(true),
    isStablecoin: z.boolean().default(false),
    stablecoinPeg: z.string().max(10).optional(), // Empty string means peg to USD
    logoUrl: z.string().url().optional(),
    ...AuditableSchema.shape,
});

export const TokenCreateSchema = TokenSchema.pick({
    symbol: true,
    name: true,
    refId: true,
    decimals: true,
    isStablecoin: true,
    stablecoinPeg: true,
    logoUrl: true,
});

export const TokenUpdateSchema = TokenSchema.omit({ id: true })
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
        message: ERR_COMMON_EMPTY_PAYLOAD,
    });

export type IToken = z.infer<typeof TokenSchema>;

export type ITokenProviderDetails = {
    id: string;
    name: string;
    symbol: string;
    decimals: number;
    image: string;
};

export class Token extends BaseModel implements IToken {
    readonly symbol: string;
    readonly name: string;
    readonly refId: string;
    readonly decimals: number;
    readonly isActive: boolean;
    readonly isStablecoin: boolean;
    readonly stablecoinPeg?: string;
    readonly logoUrl?: string;

    private constructor(props: Partial<IToken>) {
        super(props);
        Object.assign(this, props);
    }

    static create(raw: Partial<IToken>, createdById: Id): Token {
        const { success, data, error } = TokenCreateSchema.safeParse(raw);
        if (!success) throw BadRequestError(error, { layer: ErrorLayer.DOMAIN, remarks: 'Token creation failed' });

        return new Token({
            ...data,
            symbol: data.symbol.toUpperCase(), // Normalize symbol to uppercase
            isActive: true, // Default to active for new tokens
            id: IdentifierValue.v7(),
            createdById,
            updatedById: createdById,
        });
    }

    static update(existing: IToken, raw: Partial<IToken>, updatedById: Id): Token {
        const newData = {
            ...existing,
            ...raw,
            symbol: raw.symbol ? raw.symbol.toUpperCase() : existing.symbol, // Normalize symbol if provided
            updatedById,
        };
        const { success, error } = TokenUpdateSchema.safeParse(raw);
        if (!success) throw BadRequestError(error, { layer: ErrorLayer.DOMAIN, remarks: 'Token update failed' });

        return new Token(newData);
    }

    static fromPersistence(raw: IToken): Token {
        return new Token(raw);
    }
}
