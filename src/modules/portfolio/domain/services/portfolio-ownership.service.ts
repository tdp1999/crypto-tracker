import { BadRequestError, NotFoundError } from '@core/errors/domain.error';
import { ErrorLayer } from '@core/errors/types/error-layer.type.error';
import { Id } from '@core/types/common.type';
import { ERR_PORTFOLIO_ACCESS_DENIED, ERR_PORTFOLIO_NOT_FOUND } from '../portfolio.error';
import { Portfolio } from '../entities/portfolio.entity';

export class PortfolioOwnershipService {
    /**
     * Verifies that a portfolio exists and belongs to the specified user
     * @param portfolio - The portfolio to verify (can be null)
     * @param userId - The user ID to verify ownership against
     * @throws NotFoundError if portfolio doesn't exist
     * @throws BadRequestError if user doesn't own the portfolio
     */
    static verifyOwnership(portfolio: Portfolio | null, userId: Id): void {
        if (!portfolio) throw NotFoundError(ERR_PORTFOLIO_NOT_FOUND, { layer: ErrorLayer.DOMAIN });

        if (portfolio.userId !== userId)
            throw BadRequestError(ERR_PORTFOLIO_ACCESS_DENIED, { layer: ErrorLayer.DOMAIN });
    }

    /**
     * Checks if a user owns a portfolio without throwing errors
     * @param portfolio - The portfolio to check (can be null)
     * @param userId - The user ID to check ownership against
     * @returns true if user owns the portfolio, false otherwise
     */
    static hasOwnership(portfolio: Portfolio | null, userId: Id): boolean {
        return portfolio !== null && portfolio.userId === userId;
    }
}
