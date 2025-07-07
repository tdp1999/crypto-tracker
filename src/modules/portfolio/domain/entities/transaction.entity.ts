import { BaseModel } from '@core/abstractions/model.base';
import { BadRequestError } from '@core/errors/domain.error';
import { ERR_COMMON_EMPTY_PAYLOAD } from '@core/errors/messages/common.error';
import { ErrorLayer } from '@core/errors/types/error-layer.type.error';
import { AuditableSchema } from '@core/schema/auditable.schema';
import { DecimalSchema, IdSchema, RemarkSchema, TimestampSchema } from '@core/schema/common.schema';
import { Id } from '@core/types/common.type';
import { IdentifierValue } from '@shared/vos/identifier.value';
import { z } from 'zod';
import {
    ERR_TRANSACTION_INVALID_AMOUNT,
    ERR_TRANSACTION_INVALID_EXTERNAL_ID,
    ERR_TRANSACTION_PRICE_REQUIRED,
} from '../portfolio.error';
import { TokenSchema } from './portfolio-holding.entity';

export enum TransactionType {
    BUY = 'BUY',
    SELL = 'SELL',
    DEPOSIT = 'DEPOSIT',
    WITHDRAWAL = 'WITHDRAWAL',
    SWAP = 'SWAP',
}

export const TransactionTokenSchema = TokenSchema.pick({
    refId: true,
    tokenSymbol: true,
    tokenName: true,
    tokenDecimals: true,
    tokenLogoUrl: true,
});

export const TransactionSchema = z.object({
    id: IdSchema,
    portfolioId: IdSchema,

    // Transaction details
    amount: DecimalSchema,
    price: DecimalSchema, // USD
    type: z.nativeEnum(TransactionType),
    cashFlow: DecimalSchema.optional().nullable(),
    fees: DecimalSchema.min(0).default(0),
    timestamp: TimestampSchema,
    externalId: IdSchema.optional().nullable(), // Only use for SWAP
    notes: RemarkSchema.optional().nullable(),

    // token information
    ...TransactionTokenSchema.shape,

    ...AuditableSchema.shape,
});

export const TransactionCreateSchema = TransactionSchema.pick({
    refId: true,
    amount: true,
    price: true,
    type: true,
    fees: true,
    timestamp: true,
    externalId: true,
    notes: true,
})
    // Price is required for BUY, SELL, SWAP transactions
    .refine((data) => !['BUY', 'SELL', 'SWAP'].includes(data.type) || data.price, {
        message: ERR_TRANSACTION_PRICE_REQUIRED,
        path: ['price'],
    })

    // Amount must be positive for BUY, DEPOSIT; can be negative for SELL, WITHDRAWAL
    .refine(
        (data) => {
            if (['BUY', 'DEPOSIT'].includes(data.type) && data.amount <= 0) return false;
            if (['SELL', 'WITHDRAWAL'].includes(data.type) && data.amount >= 0) return false;
            return true;
        },
        {
            message: ERR_TRANSACTION_INVALID_AMOUNT,
            path: ['amount'],
        },
    )

    // External ID is required for SWAP and must be null for other types
    .refine(
        (data) => {
            if (data.type === TransactionType.SWAP) return !!data.externalId;
            return !data.externalId;
        },
        {
            message: ERR_TRANSACTION_INVALID_EXTERNAL_ID,
            path: ['externalId'],
        },
    );

export const TransactionUpdateSchema = z
    .object({
        amount: DecimalSchema.optional(),
        price: DecimalSchema.optional(),
        fees: DecimalSchema.optional().default(0),
        timestamp: TimestampSchema.optional(),
        notes: RemarkSchema.optional(),
    })
    .partial()
    .refine((data: Record<string, any>) => Object.keys(data).length > 0, {
        message: ERR_COMMON_EMPTY_PAYLOAD,
    });

export type ITransaction = z.infer<typeof TransactionSchema>;

export class Transaction extends BaseModel implements ITransaction {
    readonly refId: string;
    readonly portfolioId: Id;
    readonly tokenSymbol: string;
    readonly tokenName: string;
    readonly tokenDecimals: number;
    readonly tokenLogoUrl?: string | null;
    readonly amount: number;
    readonly price: number;
    readonly type: TransactionType;
    readonly cashFlow?: number | null;
    readonly fees: number;
    readonly timestamp: string;
    readonly externalId?: string | null;
    readonly notes?: string | null;

    private constructor(props: Partial<ITransaction>) {
        super(props);
        Object.assign(this, props);
    }

    /**
     * Creates a new transaction with  token data
     */
    static create(
        portfolioId: Id,
        transactionData: Partial<z.infer<typeof TransactionCreateSchema>>,
        createdById: Id,
    ): Transaction {
        // Apply defaults manually
        const dataWithDefaults = {
            tokenDecimals: 18,
            fees: 0,
            ...transactionData,
        };

        const { success, data, error } = TransactionCreateSchema.safeParse(dataWithDefaults);
        if (!success) {
            throw BadRequestError(error, {
                layer: ErrorLayer.DOMAIN,
                remarks: 'Transaction creation failed',
            });
        }

        const transaction = new Transaction({
            ...data,
            portfolioId,
            id: IdentifierValue.v7(),
            createdById,
            updatedById: createdById,
            cashFlow: Transaction.calculateCashFlow(data),
        });

        return transaction;
    }

    /**
     * Updates transaction details (limited fields)
     */
    static update(
        existing: ITransaction,
        transactionData: z.infer<typeof TransactionUpdateSchema>,
        updatedById: Id,
    ): Transaction {
        const { success, error } = TransactionUpdateSchema.safeParse(transactionData);
        if (!success) {
            throw BadRequestError(error, {
                layer: ErrorLayer.DOMAIN,
                remarks: 'Transaction update failed',
            });
        }

        const newData = { ...existing, ...transactionData, updatedById };
        // Recalculate cash flow if relevant fields changed
        if (transactionData.amount || transactionData.price || transactionData.fees) {
            newData.cashFlow = Transaction.calculateCashFlow(newData);
        }

        return new Transaction(newData);
    }

    /**
     * Marks transaction for deletion (soft delete)
     */
    static markDeleted(existing: ITransaction, deletedById: Id): Transaction {
        return new Transaction({
            ...existing,
            deletedAt: new Date().toISOString(),
            deletedById,
        });
    }

    /**
     * Calculates cash flow impact of transaction
     * Positive = money coming in, Negative = money going out
     */
    static calculateCashFlow(transaction: Partial<ITransaction>): number {
        const { type, amount, price, fees } = transaction;

        if (!price) return 0;

        const absoluteAmount = Math.abs(amount || 0);
        const totalFees = fees || 0;

        switch (type) {
            case TransactionType.BUY:
                // Money out = -(price * quantity + fees)
                return -(absoluteAmount * price + totalFees);

            case TransactionType.SELL:
                // Money in = (price * quantity - fees)
                return absoluteAmount * price - totalFees;

            case TransactionType.DEPOSIT:
                // No cash flow for crypto deposits (unless it's a stablecoin)
                return 0;

            case TransactionType.WITHDRAWAL:
                // No cash flow for crypto withdrawals (unless it's a stablecoin)
                return 0;

            case TransactionType.SWAP:
                // No direct cash flow for swaps
                return 0;

            default:
                return 0;
        }
    }

    /**
     * Calculates the total value of this transaction
     */
    getTotalValue(): number {
        if (!this.price) return 0;
        return Math.abs(this.amount) * this.price;
    }

    /**
     * Gets the total cost including fees
     */
    getTotalCost(): number {
        return this.getTotalValue() + this.fees;
    }

    /**
     * Checks if transaction increases portfolio holdings
     */
    isPositiveTransaction(): boolean {
        return [TransactionType.BUY, TransactionType.DEPOSIT].includes(this.type);
    }

    /**
     * Checks if transaction decreases portfolio holdings
     */
    isNegativeTransaction(): boolean {
        return [TransactionType.SELL, TransactionType.WITHDRAWAL].includes(this.type);
    }

    /**
     * Checks if this is a swap transaction
     */
    isSwapTransaction(): boolean {
        return this.type === TransactionType.SWAP;
    }

    /**
     * Validates transaction amount based on type
     */
    validateAmount(): boolean {
        if (this.isPositiveTransaction()) {
            return this.amount > 0;
        }
        if (this.isNegativeTransaction()) {
            return this.amount < 0;
        }
        return true; // SWAP can be positive or negative
    }

    /**
     * Gets the absolute quantity being transacted
     */
    getAbsoluteAmount(): number {
        return Math.abs(this.amount);
    }

    /**
     * Gets token identifier for external API calls
     */
    getTokenIdentifier(): string {
        return this.tokenSymbol.toLowerCase();
    }

    /**
     * Checks if transaction is active (not soft deleted)
     */
    isActive(): boolean {
        return !this.deletedAt;
    }

    /**
     * Validates if transaction date is not in the future
     */
    static validateTransactionDate(date: string): boolean {
        const timestamp = new Date(date);
        const now = new Date();
        return timestamp <= now;
    }

    /**
     * Creates a Transaction instance from persistence data
     */
    static fromPersistence(props: ITransaction): Transaction {
        return Object.assign(Object.create(Transaction.prototype), props);
    }
}
