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
    refId: z.string().min(1).max(20), // E.g: btc-bitcoin, eth-ethereum, sol-solana, etc.
    tokenSymbol: z.string().min(1).max(20), // E.g: BTC, ETH, SOL, etc.
    tokenName: z.string().max(100).optional(), // E.g: Bitcoin, Ethereum, Solana, etc.
    tokenDecimals: z.number().int().min(0).max(18).default(18),
    tokenLogoUrl: z.string().url().optional(),
    isStablecoin: z.boolean().default(false),
    stablecoinPeg: z.string().max(10).optional(),
});

export const PortfolioHoldingSchema = z.object({
    id: IdSchema,
    portfolioId: IdSchema,
    ...TokenSchema.shape,
    ...AuditableSchema.shape,
});

export const PortfolioHoldingCreateSchema = TokenSchema.extend({
    portfolioId: IdSchema,
});

export const PortfolioHoldingUpdateSchema = PortfolioHoldingCreateSchema.partial().refine(
    (data) => Object.keys(data).length > 0,
    {
        message: ERR_COMMON_EMPTY_PAYLOAD,
    },
);

export type IPortfolioHolding = z.infer<typeof PortfolioHoldingSchema>;
export type IToken = z.infer<typeof TokenSchema>;

export class PortfolioHolding extends BaseModel implements IPortfolioHolding {
    readonly portfolioId: Id;
    readonly refId: string;
    readonly tokenSymbol: string;
    readonly tokenName?: string;
    readonly tokenDecimals: number;
    readonly tokenLogoUrl?: string;
    readonly isStablecoin: boolean;
    readonly stablecoinPeg?: string;

    private constructor(props: Partial<IPortfolioHolding>) {
        super(props);
        Object.assign(this, props);
    }

    /**
     * Creates a new portfolio holding (token registration)
     * Simplified model - no quantities or prices stored here
     */
    static create(raw: Partial<IPortfolioHolding>, createdById: Id): PortfolioHolding {
        const { success, data, error } = PortfolioHoldingCreateSchema.safeParse(raw);
        if (!success) {
            throw BadRequestError(error, {
                layer: ErrorLayer.DOMAIN,
                remarks: 'Portfolio holding creation failed',
            });
        }

        return new PortfolioHolding({
            ...data,
            id: IdentifierValue.v7(),
            createdById,
            updatedById: createdById,
        });
    }

    /**
     * Updates token metadata (not quantities/prices)
     * Only token metadata can be updated after token enhancement
     */
    static update(existing: IPortfolioHolding, raw: Partial<IPortfolioHolding>, updatedById: Id): PortfolioHolding {
        const { success, error } = PortfolioHoldingUpdateSchema.safeParse(raw);
        if (!success) {
            throw BadRequestError(error, {
                layer: ErrorLayer.DOMAIN,
                remarks: 'Portfolio holding update failed',
            });
        }

        const newData = { ...existing, ...raw, updatedById };
        return new PortfolioHolding(newData);
    }

    /**
     * Marks holding for deletion (soft delete)
     * Historical transactions remain for audit trail
     */
    static markDeleted(existing: IPortfolioHolding, deletedById: Id): PortfolioHolding {
        return new PortfolioHolding({
            ...existing,
            deletedAt: new Date().toISOString(),
            deletedById,
        });
    }

    /**
     * Validates if token symbol format is acceptable
     */
    static validateTokenSymbol(symbol: string): boolean {
        const symbolRegex = /^[A-Z0-9]{1,20}$/;
        return symbolRegex.test(symbol.toUpperCase());
    }

    static fromPersistence(raw: IPortfolioHolding): PortfolioHolding {
        return new PortfolioHolding(raw);
    }

    /**
     * Checks if this holding is for a stablecoin
     */
    isStablecoinHolding(): boolean {
        return this.isStablecoin;
    }

    /**
     * Gets the stablecoin peg currency if applicable
     */
    getStablecoinPeg(): string | undefined {
        return this.isStablecoin ? this.stablecoinPeg : undefined;
    }

    /**
     * Returns token identifier for external API calls (symbol serves as ref_id)
     */
    getTokenIdentifier(): string {
        return this.tokenSymbol.toLowerCase();
    }

    /**
     * Checks if holding is active (not soft deleted)
     */
    isActive(): boolean {
        return !this.deletedAt;
    }
}
