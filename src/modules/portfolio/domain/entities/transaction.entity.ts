import { BaseModel } from '@core/abstractions/model.base';
import { BadRequestError } from '@core/errors/domain.error';
import { ERR_COMMON_EMPTY_PAYLOAD } from '@core/errors/messages/common.error';
import { ErrorLayer } from '@core/errors/types/error-layer.type.error';
import { AuditableSchema } from '@core/schema/auditable.schema';
import { IdSchema } from '@core/schema/common.schema';
import { Id } from '@core/types/common.type';
import { IdentifierValue } from '@shared/vos/identifier.value';
import { z } from 'zod';
import { TokenSchema } from '../portfolio-holding.entity';

// Transaction types enum
export enum TransactionType {
    BUY = 'BUY',
    SELL = 'SELL',
    DEPOSIT = 'DEPOSIT',
    WITHDRAWAL = 'WITHDRAWAL',
    SWAP = 'SWAP',
}

// Transaction validation schemas
export const TransactionSchema = z.object({
    id: IdSchema,
    portfolioId: IdSchema,

    // token information
    tokenSymbol: TokenSchema.shape.tokenSymbol,
    tokenName: TokenSchema.shape.tokenName,
    tokenDecimals: TokenSchema.shape.tokenDecimals,
    tokenLogoUrl: TokenSchema.shape.tokenLogoUrl,

    // Transaction details
    amount: z.number().multipleOf(0.000000000000000001), // 18 decimal precision
    pricePerToken: z.number().min(0).multipleOf(0.000000000000000001).optional(),
    transactionType: z.nativeEnum(TransactionType),
    cashFlow: z.number().multipleOf(0.000000000000000001).optional(),
    fees: z.number().min(0).multipleOf(0.000000000000000001).default(0),
    transactionDate: z.string().datetime(),
    externalTransactionId: z.string().max(100).optional(),
    notes: z.string().max(1000).optional(),

    // Portfolio impact tracking
    portfolioValueBefore: z.number().multipleOf(0.000000000000000001).optional(),
    portfolioValueAfter: z.number().multipleOf(0.000000000000000001).optional(),

    ...AuditableSchema.shape,
});

export const TransactionCreateSchema = z
    .object({
        tokenSymbol: z
            .string()
            .min(1)
            .max(20)
            .transform((s) => s.toUpperCase()),
        tokenName: z.string().max(100).optional(),
        tokenDecimals: z.number().int().min(0).max(18).optional().default(18),
        tokenLogoUrl: z.string().url().optional(),
        amount: z.number().multipleOf(0.000000000000000001),
        pricePerToken: z.number().min(0).multipleOf(0.000000000000000001).optional(),
        transactionType: z.nativeEnum(TransactionType),
        fees: z.number().min(0).multipleOf(0.000000000000000001).optional().default(0),
        transactionDate: z.string().datetime(),
        externalTransactionId: z.string().max(100).optional(),
        notes: z.string().max(1000).optional(),
    })
    .refine(
        (data) => {
            // Price is required for BUY, SELL, SWAP transactions
            if (['BUY', 'SELL', 'SWAP'].includes(data.transactionType) && !data.pricePerToken) {
                return false;
            }
            return true;
        },
        {
            message: 'Price per token is required for BUY, SELL, and SWAP transactions',
            path: ['pricePerToken'],
        },
    )
    .refine(
        (data) => {
            // Amount must be positive for BUY, DEPOSIT; can be negative for SELL, WITHDRAWAL
            if (['BUY', 'DEPOSIT'].includes(data.transactionType) && data.amount <= 0) {
                return false;
            }
            if (['SELL', 'WITHDRAWAL'].includes(data.transactionType) && data.amount >= 0) {
                return false;
            }
            return true;
        },
        {
            message: 'Amount must be positive for BUY/DEPOSIT and negative for SELL/WITHDRAWAL',
            path: ['amount'],
        },
    );

export const TransactionUpdateSchema = z
    .object({
        tokenName: z.string().max(100).optional(),
        tokenDecimals: z.number().int().min(0).max(18).default(18),
        tokenLogoUrl: z.string().url().optional(),
        amount: z.number().multipleOf(0.000000000000000001),
        pricePerToken: z.number().min(0).multipleOf(0.000000000000000001).optional(),
        fees: z.number().min(0).multipleOf(0.000000000000000001).default(0),
        transactionDate: z.string().datetime(),
        externalTransactionId: z.string().max(100).optional(),
        notes: z.string().max(1000).optional(),
    })
    .partial()
    .refine((data: Record<string, any>) => Object.keys(data).length > 0, {
        message: ERR_COMMON_EMPTY_PAYLOAD,
    });

export type ITransaction = z.infer<typeof TransactionSchema>;

export class Transaction extends BaseModel implements ITransaction {
    readonly portfolioId: Id;
    readonly tokenSymbol: string;
    readonly tokenName?: string;
    readonly tokenDecimals: number;
    readonly tokenLogoUrl?: string;
    readonly amount: number;
    readonly pricePerToken?: number;
    readonly transactionType: TransactionType;
    readonly cashFlow?: number;
    readonly fees: number;
    readonly transactionDate: string;
    readonly externalTransactionId?: string;
    readonly notes?: string;
    readonly portfolioValueBefore?: number;
    readonly portfolioValueAfter?: number;

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
        portfolioValueBefore?: number,
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
            portfolioValueBefore,
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
        if (transactionData.amount || transactionData.pricePerToken || transactionData.fees) {
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
        const { transactionType, amount, pricePerToken, fees } = transaction;

        if (!pricePerToken) return 0;

        const absoluteAmount = Math.abs(amount || 0);
        const totalFees = fees || 0;

        switch (transactionType) {
            case TransactionType.BUY:
                // Money out = -(price * quantity + fees)
                return -(absoluteAmount * pricePerToken + totalFees);

            case TransactionType.SELL:
                // Money in = (price * quantity - fees)
                return absoluteAmount * pricePerToken - totalFees;

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
        if (!this.pricePerToken) return 0;
        return Math.abs(this.amount) * this.pricePerToken;
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
        return [TransactionType.BUY, TransactionType.DEPOSIT].includes(this.transactionType);
    }

    /**
     * Checks if transaction decreases portfolio holdings
     */
    isNegativeTransaction(): boolean {
        return [TransactionType.SELL, TransactionType.WITHDRAWAL].includes(this.transactionType);
    }

    /**
     * Checks if this is a swap transaction
     */
    isSwapTransaction(): boolean {
        return this.transactionType === TransactionType.SWAP;
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
     * Calculates portfolio impact based on before/after values
     */
    getPortfolioImpact(): number | undefined {
        if (this.portfolioValueBefore === undefined || this.portfolioValueAfter === undefined) {
            return undefined;
        }
        return this.portfolioValueAfter - this.portfolioValueBefore;
    }

    /**
     * Sets portfolio value after transaction
     */
    withPortfolioValueAfter(portfolioValueAfter: number): Transaction {
        return new Transaction({
            ...this,
            portfolioValueAfter,
        });
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
        const transactionDate = new Date(date);
        const now = new Date();
        return transactionDate <= now;
    }
}
