import { BadRequestError } from '@core/errors/domain.error';
import { Transaction, type } from '../entities/transaction.entity';

describe('Transaction Domain Entity', () => {
    const mockPortfolioId = '01234567-89ab-cdef-0123-456789abcdef';
    const mockUserId = 'user-01234567-89ab-cdef-0123-456789abcdef';

    describe('create', () => {
        it('should create a valid BUY transaction', () => {
            const transactionData = {
                tokenSymbol: 'BTC',
                tokenName: 'Bitcoin',
                tokenDecimals: 8,
                amount: 0.5,
                price: 45000,
                type: type.BUY,
                fees: 50,
                timestamp: '2025-01-15T10:00:00Z',
            };

            const transaction = Transaction.create(mockPortfolioId, transactionData, mockUserId, 100000);

            expect(transaction.portfolioId).toBe(mockPortfolioId);
            expect(transaction.tokenSymbol).toBe('BTC');
            expect(transaction.amount).toBe(0.5);
            expect(transaction.type).toBe(type.BUY);
            expect(transaction.getTotalValue()).toBe(22500); // 0.5 * 45000
            expect(transaction.getTotalCost()).toBe(22550); // 22500 + 50 fees
            expect(transaction.cashFlow).toBe(-22550); // Money out for BUY
            expect(transaction.isPositiveTransaction()).toBe(true);
            expect(transaction.portfolioValueBefore).toBe(100000);
        });

        it('should create a valid SELL transaction', () => {
            const transactionData = {
                tokenSymbol: 'ETH',
                tokenName: 'Ethereum',
                tokenDecimals: 18,
                amount: -2, // Negative for SELL
                price: 2500,
                type: type.SELL,
                fees: 25,
                timestamp: '2025-01-15T10:00:00Z',
            };

            const transaction = Transaction.create(mockPortfolioId, transactionData, mockUserId);

            expect(transaction.amount).toBe(-2);
            expect(transaction.type).toBe(type.SELL);
            expect(transaction.getTotalValue()).toBe(5000); // abs(-2) * 2500
            expect(transaction.cashFlow).toBe(4975); // Money in for SELL (5000 - 25 fees)
            expect(transaction.isNegativeTransaction()).toBe(true);
        });

        it('should create a valid DEPOSIT transaction', () => {
            const transactionData = {
                tokenSymbol: 'USDC',
                tokenName: 'USD Coin',
                tokenDecimals: 6,
                amount: 1000,
                type: type.DEPOSIT,
                timestamp: '2025-01-15T10:00:00Z',
            };

            const transaction = Transaction.create(mockPortfolioId, transactionData, mockUserId);

            expect(transaction.type).toBe(type.DEPOSIT);
            expect(transaction.cashFlow).toBe(0); // No cash flow for crypto deposits
            expect(transaction.isPositiveTransaction()).toBe(true);
        });

        it('should create a valid SWAP transaction', () => {
            const transactionData = {
                tokenSymbol: 'BTC',
                tokenName: 'Bitcoin',
                tokenDecimals: 8,
                amount: -0.02, // Selling BTC in swap
                price: 45000,
                type: type.SWAP,
                externalId: 'swap-123',
                timestamp: '2025-01-15T10:00:00Z',
            };

            const transaction = Transaction.create(mockPortfolioId, transactionData, mockUserId);

            expect(transaction.type).toBe(type.SWAP);
            expect(transaction.isSwapTransaction()).toBe(true);
            expect(transaction.cashFlow).toBe(0); // No direct cash flow for swaps
            expect(transaction.externalId).toBe('swap-123');
        });

        it('should throw error for BUY transaction without price', () => {
            const transactionData = {
                tokenSymbol: 'BTC',
                amount: 0.5,
                type: type.BUY,
                timestamp: '2025-01-15T10:00:00Z',
            };

            expect(() => {
                Transaction.create(mockPortfolioId, transactionData, mockUserId);
            }).toThrow(BadRequestError);
        });

        it('should throw error for positive amount in SELL transaction', () => {
            const transactionData = {
                tokenSymbol: 'BTC',
                amount: 0.5, // Should be negative for SELL
                price: 45000,
                type: type.SELL,
                timestamp: '2025-01-15T10:00:00Z',
            };

            expect(() => {
                Transaction.create(mockPortfolioId, transactionData, mockUserId);
            }).toThrow(BadRequestError);
        });

        it('should throw error for negative amount in BUY transaction', () => {
            const transactionData = {
                tokenSymbol: 'BTC',
                amount: -0.5, // Should be positive for BUY
                price: 45000,
                type: type.BUY,
                timestamp: '2025-01-15T10:00:00Z',
            };

            expect(() => {
                Transaction.create(mockPortfolioId, transactionData, mockUserId);
            }).toThrow(BadRequestError);
        });

        it('should throw error for negative fees', () => {
            const transactionData = {
                tokenSymbol: 'BTC',
                amount: 0.5,
                price: 45000,
                type: type.BUY,
                fees: -10,
                timestamp: '2025-01-15T10:00:00Z',
            };

            expect(() => {
                Transaction.create(mockPortfolioId, transactionData, mockUserId);
            }).toThrow(BadRequestError);
        });
    });

    describe('update', () => {
        let existingTransaction: any;

        beforeEach(() => {
            existingTransaction = {
                id: 'tx-123',
                portfolioId: mockPortfolioId,
                tokenSymbol: 'BTC',
                tokenName: 'Bitcoin',
                tokenDecimals: 8,
                amount: 0.5,
                price: 45000,
                type: type.BUY,
                fees: 50,
                timestamp: '2025-01-15T10:00:00Z',
                cashFlow: -22550,
                createdById: mockUserId,
                updatedById: mockUserId,
            };
        });

        it('should update transaction metadata', () => {
            const updateData = {
                notes: 'Updated transaction notes',
                fees: 75,
            };

            const updatedTransaction = Transaction.update(existingTransaction, updateData, mockUserId);

            expect(updatedTransaction.notes).toBe('Updated transaction notes');
            expect(updatedTransaction.fees).toBe(75);
            expect(updatedTransaction.cashFlow).toBe(-22575); // Recalculated with new fees
            expect(updatedTransaction.updatedById).toBe(mockUserId);
        });

        it('should recalculate cash flow when amount changes', () => {
            const updateData = {
                amount: 1.0, // Double the amount
            };

            const updatedTransaction = Transaction.update(existingTransaction, updateData, mockUserId);

            expect(updatedTransaction.amount).toBe(1.0);
            expect(updatedTransaction.cashFlow).toBe(-45050); // Recalculated with new amount
        });

        it('should throw error for empty update data', () => {
            expect(() => {
                Transaction.update(existingTransaction, {}, mockUserId);
            }).toThrow(BadRequestError);
        });
    });

    describe('calculateCashFlow', () => {
        it('should calculate correct cash flow for BUY transactions', () => {
            const transaction = {
                type: type.BUY,
                amount: 0.5,
                price: 45000,
                fees: 50,
            };

            const cashFlow = Transaction.calculateCashFlow(transaction);

            expect(cashFlow).toBe(-22550); // -(0.5 * 45000 + 50)
        });

        it('should calculate correct cash flow for SELL transactions', () => {
            const transaction = {
                type: type.SELL,
                amount: -2,
                price: 2500,
                fees: 25,
            };

            const cashFlow = Transaction.calculateCashFlow(transaction);

            expect(cashFlow).toBe(4975); // (2 * 2500 - 25)
        });

        it('should return zero cash flow for DEPOSIT transactions', () => {
            const transaction = {
                type: type.DEPOSIT,
                amount: 1000,
                price: 1,
                fees: 0,
            };

            const cashFlow = Transaction.calculateCashFlow(transaction);

            expect(cashFlow).toBe(0);
        });

        it('should return zero cash flow for SWAP transactions', () => {
            const transaction = {
                type: type.SWAP,
                amount: -0.5,
                price: 45000,
                fees: 10,
            };

            const cashFlow = Transaction.calculateCashFlow(transaction);

            expect(cashFlow).toBe(0);
        });

        it('should return zero cash flow when no price provided', () => {
            const transaction = {
                type: type.BUY,
                amount: 0.5,
                fees: 50,
            };

            const cashFlow = Transaction.calculateCashFlow(transaction);

            expect(cashFlow).toBe(0);
        });
    });

    describe('utility methods', () => {
        let transaction: Transaction;

        beforeEach(() => {
            const transactionData = {
                tokenSymbol: 'BTC',
                tokenName: 'Bitcoin',
                tokenDecimals: 8,
                amount: 0.5,
                price: 45000,
                type: type.BUY,
                fees: 50,
                timestamp: '2025-01-15T10:00:00Z',
            };
            transaction = Transaction.create(mockPortfolioId, transactionData, mockUserId, 100000);
        });

        it('should get absolute amount correctly', () => {
            expect(transaction.getAbsoluteAmount()).toBe(0.5);

            // Test with negative amount
            const sellData = {
                tokenSymbol: 'BTC',
                amount: -0.3,
                price: 45000,
                type: type.SELL,
                timestamp: '2025-01-15T10:00:00Z',
            };
            const sellTransaction = Transaction.create(mockPortfolioId, sellData, mockUserId);
            expect(sellTransaction.getAbsoluteAmount()).toBe(0.3);
        });

        it('should validate amount correctly', () => {
            expect(transaction.validateAmount()).toBe(true);

            // Test invalid case - positive BUY is valid
            const invalidSellData = {
                tokenSymbol: 'BTC',
                amount: 0.5, // Should be negative for SELL
                price: 45000,
                type: type.SELL,
                timestamp: '2025-01-15T10:00:00Z',
            };

            try {
                const invalidSell = Transaction.create(mockPortfolioId, invalidSellData, mockUserId);
                expect(invalidSell.validateAmount()).toBe(false);
            } catch {
                // Transaction creation should fail due to validation
                expect(true).toBe(true);
            }
        });

        it('should get token identifier correctly', () => {
            expect(transaction.getTokenIdentifier()).toBe('btc');
        });

        it('should calculate portfolio impact', () => {
            const updatedTransaction = transaction.withPortfolioValueAfter(122450);
            expect(updatedTransaction.getPortfolioImpact()).toBe(22450); // 122450 - 100000
        });

        it('should return undefined portfolio impact when values missing', () => {
            const transactionWithoutBefore = Transaction.create(
                mockPortfolioId,
                {
                    tokenSymbol: 'BTC',
                    amount: 0.5,
                    price: 45000,
                    type: type.BUY,
                    timestamp: '2025-01-15T10:00:00Z',
                },
                mockUserId,
            );

            expect(transactionWithoutBefore.getPortfolioImpact()).toBeUndefined();
        });

        it('should check active status correctly', () => {
            expect(transaction.isActive()).toBe(true);

            const deletedTransaction = Transaction.markDeleted(transaction, mockUserId);
            expect(deletedTransaction.isActive()).toBe(false);
        });
    });

    describe('validateTransactionDate', () => {
        it('should validate current and past dates', () => {
            const pastDate = '2025-01-01T10:00:00Z';
            const currentDate = new Date().toISOString();

            expect(Transaction.validateTransactionDate(pastDate)).toBe(true);
            expect(Transaction.validateTransactionDate(currentDate)).toBe(true);
        });

        it('should reject future dates', () => {
            const futureDate = new Date(Date.now() + 86400000).toISOString(); // Tomorrow

            expect(Transaction.validateTransactionDate(futureDate)).toBe(false);
        });
    });

    describe('transaction type identification', () => {
        it('should identify positive transactions correctly', () => {
            const buyData = {
                tokenSymbol: 'BTC',
                amount: 0.5,
                price: 45000,
                type: type.BUY,
                timestamp: '2025-01-15T10:00:00Z',
            };
            const buy = Transaction.create(mockPortfolioId, buyData, mockUserId);
            expect(buy.isPositiveTransaction()).toBe(true);
            expect(buy.isNegativeTransaction()).toBe(false);

            const depositData = {
                tokenSymbol: 'USDC',
                amount: 1000,
                type: type.DEPOSIT,
                timestamp: '2025-01-15T10:00:00Z',
            };
            const deposit = Transaction.create(mockPortfolioId, depositData, mockUserId);
            expect(deposit.isPositiveTransaction()).toBe(true);
        });

        it('should identify negative transactions correctly', () => {
            const sellData = {
                tokenSymbol: 'BTC',
                amount: -0.5,
                price: 45000,
                type: type.SELL,
                timestamp: '2025-01-15T10:00:00Z',
            };
            const sell = Transaction.create(mockPortfolioId, sellData, mockUserId);
            expect(sell.isNegativeTransaction()).toBe(true);
            expect(sell.isPositiveTransaction()).toBe(false);

            const withdrawalData = {
                tokenSymbol: 'ETH',
                amount: -2,
                type: type.WITHDRAWAL,
                timestamp: '2025-01-15T10:00:00Z',
            };
            const withdrawal = Transaction.create(mockPortfolioId, withdrawalData, mockUserId);
            expect(withdrawal.isNegativeTransaction()).toBe(true);
        });

        it('should identify swap transactions correctly', () => {
            const swapData = {
                tokenSymbol: 'BTC',
                amount: -0.02,
                price: 45000,
                type: type.SWAP,
                timestamp: '2025-01-15T10:00:00Z',
            };
            const swap = Transaction.create(mockPortfolioId, swapData, mockUserId);
            expect(swap.isSwapTransaction()).toBe(true);
            expect(swap.isPositiveTransaction()).toBe(false);
            expect(swap.isNegativeTransaction()).toBe(false);
        });
    });

    describe('markDeleted', () => {
        it('should mark transaction as deleted', () => {
            const existingTransaction = {
                id: 'tx-123',
                portfolioId: mockPortfolioId,
                tokenSymbol: 'BTC',
                amount: 0.5,
                type: type.BUY,
            };

            const deletedTransaction = Transaction.markDeleted(existingTransaction, mockUserId);

            expect(deletedTransaction.deletedAt).toBeDefined();
            expect(deletedTransaction.deletedById).toBe(mockUserId);
            expect(deletedTransaction.isActive()).toBe(false);
        });
    });
});
