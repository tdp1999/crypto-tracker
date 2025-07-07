import { IRepository } from '@core/interfaces/repository.interface';
import { Id } from '@core/types/common.type';
import { Transaction } from '../../domain/entities/transaction.entity';
import { TransactionQueryDto } from '../transaction.dto';

export type ITransactionRepository = IRepository<Transaction, TransactionQueryDto> & {
    /**
     * Find all transactions for a specific portfolio
     */
    findByPortfolioId(portfolioId: Id): Promise<Transaction[]>;

    /**
     * Find all transactions for a specific token in a portfolio
     */
    findByPortfolioIdAndTokenSymbol(portfolioId: Id, tokenSymbol: string): Promise<Transaction[]>;

    /**
     * Find all transactions for a specific token across all portfolios of a user
     */
    findByTokenSymbol(tokenSymbol: string, userId: Id): Promise<Transaction[]>;

    /**
     * Count transactions by portfolio ID
     */
    countByPortfolioId(portfolioId: Id): Promise<number>;

    /**
     * Find transactions by external ID (used for swap pairs)
     */
    findByExternalId(externalId: string): Promise<Transaction[]>;

    /**
     * Find transactions within a date range for a portfolio
     */
    findByPortfolioIdAndDateRange(portfolioId: Id, startDate: string, endDate: string): Promise<Transaction[]>;

    /**
     * Soft delete a transaction (mark as deleted)
     */
    softDelete(transactionId: Id, deletedById: Id): Promise<void>;
};
