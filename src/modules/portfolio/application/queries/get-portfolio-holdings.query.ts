// FLAG: PENDING VERIFICATION
import { BadRequestError } from '@core/errors/domain.error';
import { ErrorLayer } from '@core/errors/types/error-layer.type.error';
import { Id } from '@core/types/common.type';
import { Inject, Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { z } from 'zod';
import { IPortfolioHolding, PortfolioHolding } from '../../domain/entities/portfolio-holding.entity';
import { PortfolioOwnershipService } from '../../domain/services/portfolio-ownership.service';
import { PORTFOLIO_TOKENS } from '../portfolio.token';
import { IPortfolioHoldingRepository } from '../ports/portfolio-holding-repository.out.port';
import { IPortfolioProviderRepository } from '../ports/portfolio-provider-repository.out.port';
import { IPortfolioRepository } from '../ports/portfolio-repository.out.port';

export interface IPortfolioHoldingWithMetrics extends IPortfolioHolding {
    // Calculated from transactions
    quantity: number;
    averageBuyPrice?: number;
    totalCostBasis?: number;

    // Current market data (if includePrices=true)
    currentPrice?: number;
    currentValue?: number;
    pnl?: number;
    pnlPercentage?: number;
    weightPercentage?: number;

    // Additional metadata
    firstPurchaseDate?: string;
    lastTransactionDate?: string;
}

export const GetPortfolioHoldingsQuerySchema = z.object({
    includePrices: z.boolean().default(false),
});
export class GetPortfolioHoldingsQuery {
    constructor(public readonly payload: { portfolioId: Id; userId: Id; queries: unknown }) {}
}

@Injectable()
@QueryHandler(GetPortfolioHoldingsQuery)
export class GetPortfolioHoldingsQueryHandler implements IQueryHandler<GetPortfolioHoldingsQuery> {
    constructor(
        @Inject(PORTFOLIO_TOKENS.REPOSITORIES.PORTFOLIO)
        private readonly portfolioRepository: IPortfolioRepository,

        @Inject(PORTFOLIO_TOKENS.REPOSITORIES.PORTFOLIO_HOLDING)
        private readonly portfolioHoldingRepository: IPortfolioHoldingRepository,

        @Inject(PORTFOLIO_TOKENS.REPOSITORIES.PORTFOLIO_PROVIDER)
        private readonly providerRepository: IPortfolioProviderRepository,
    ) {}

    async execute(query: GetPortfolioHoldingsQuery): Promise<PortfolioHolding[]> {
        // Validate query
        const { portfolioId, userId, queries } = query.payload;
        const { success, error } = GetPortfolioHoldingsQuerySchema.safeParse(queries);
        if (!success) {
            throw BadRequestError(error, { layer: ErrorLayer.APPLICATION });
        }

        // Verify portfolio exists and user has access
        const portfolioData = await this.portfolioRepository.getOwnershipData(portfolioId);
        PortfolioOwnershipService.verifyOwnership(portfolioData, userId);

        // Get active holdings for the portfolio
        const holdings = await this.portfolioHoldingRepository.findActiveByPortfolioId(portfolioId);

        // TODO: Calculate metrics from transactions for each holding
        // const holdingsWithMetrics = await Promise.all(
        //     activeHoldings.map(async (holding) => {
        //         // Get all transactions for this token in the portfolio
        //         const transactions = await this.transactionRepository.findByPortfolioAndToken(
        //             portfolioId,
        //             holding.tokenSymbol
        //         );

        //         // Calculate metrics from transactions
        //         const metrics = this.calculateHoldingMetrics(transactions);

        //         return {
        //             ...holding,
        //             ...metrics,
        //         };
        //     })
        // );

        // TODO: Add current prices if requested
        // if (includePrices && holdingsWithMetrics.length > 0) {
        //     await this.enrichWithCurrentPrices(holdingsWithMetrics);
        // }

        // For now, return empty array until repositories are implemented
        return holdings;
    }

    /**
     * Calculate holding metrics from transaction history
     * TODO: Implement when transaction entity is ready
     */
    private calculateHoldingMetrics(transactions: any[]): {
        quantity: number;
        averageBuyPrice?: number;
        totalCostBasis?: number;
        firstPurchaseDate?: string;
        lastTransactionDate?: string;
    } {
        // Mock implementation - replace with actual calculation logic
        return {
            quantity: 0,
            averageBuyPrice: 0,
            totalCostBasis: 0,
            firstPurchaseDate: undefined,
            lastTransactionDate: undefined,
        };

        // TODO: Actual implementation would be:
        // let totalQuantity = 0;
        // let totalCostBasis = 0;
        // let firstPurchase: Date | null = null;
        // let lastTransaction: Date | null = null;

        // for (const transaction of transactions) {
        //     totalQuantity += transaction.amount; // Positive for buy/deposit, negative for sell/withdrawal
        //
        //     if (transaction.amount > 0 && transaction.price) {
        //         totalCostBasis += transaction.amount * transaction.price;
        //     }
        //
        //     const txDate = new Date(transaction.timestamp);
        //     if (!firstPurchase || txDate < firstPurchase) {
        //         firstPurchase = txDate;
        //     }
        //     if (!lastTransaction || txDate > lastTransaction) {
        //         lastTransaction = txDate;
        //     }
        // }

        // const averageBuyPrice = totalQuantity > 0 ? totalCostBasis / totalQuantity : 0;

        // return {
        //     quantity: totalQuantity,
        //     averageBuyPrice,
        //     totalCostBasis,
        //     firstPurchaseDate: firstPurchase?.toISOString(),
        //     lastTransactionDate: lastTransaction?.toISOString(),
        // };
    }

    /**
     * Enrich holdings with current market prices and P&L calculations
     */
    private async enrichWithCurrentPrices(holdings: IPortfolioHoldingWithMetrics[]): Promise<void> {
        try {
            // Get all unique token IDs
            const tokenIds = holdings.map((holding) => holding.refId).filter(Boolean);

            if (!tokenIds) return;

            // Fetch current prices from provider
            const prices = await this.providerRepository.getTokenPrices(tokenIds);
            const priceMap = new Map(prices.map((p) => [p.id, p]));

            // Calculate P&L and portfolio weights
            let totalPortfolioValue = 0;

            // First pass: calculate current values
            for (const holding of holdings) {
                const price = priceMap.get(holding.refId);
                if (price) {
                    holding.currentPrice = price.price;
                    holding.currentValue = holding.quantity * price.price;
                    totalPortfolioValue += holding.currentValue;

                    // Calculate P&L
                    if (holding.totalCostBasis && holding.totalCostBasis > 0) {
                        holding.pnl = holding.currentValue - holding.totalCostBasis;
                        holding.pnlPercentage = (holding.pnl / holding.totalCostBasis) * 100;
                    }
                }
            }

            // Second pass: calculate portfolio weights
            if (totalPortfolioValue > 0) {
                for (const holding of holdings) {
                    if (holding.currentValue) {
                        holding.weightPercentage = (holding.currentValue / totalPortfolioValue) * 100;
                    }
                }
            }
        } catch (error) {
            // If price fetching fails, continue without current market data
            console.warn('Failed to fetch current prices:', error);
        }
    }
}
