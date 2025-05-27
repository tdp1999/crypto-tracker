import { BadRequestError } from '@core/errors/domain.error';
import { ErrorLayer } from '@core/errors/types/error-layer.type.error';
import { DetailQuerySchema } from '@core/schema/query.schema';
import { Id } from '@core/types/common.type';
import { Inject, Injectable } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { IPortfolioRepository } from '../ports/portfolio-repository.out.port';
import { PORTFOLIO_TOKENS } from '../portfolio.token';

export class PortfolioOwnershipQuery {
    constructor(public readonly payload: { portfolioId: Id; userId: Id }) {}
}

@Injectable()
@QueryHandler(PortfolioOwnershipQuery)
export class PortfolioOwnershipQueryHandler implements IQueryHandler<PortfolioOwnershipQuery, boolean> {
    constructor(
        @Inject(PORTFOLIO_TOKENS.REPOSITORIES)
        private readonly portfolioRepository: IPortfolioRepository,
    ) {}

    async execute(query: PortfolioOwnershipQuery): Promise<boolean> {
        const { portfolioId, userId } = query.payload;
        const { success, error } = DetailQuerySchema.safeParse({ id: portfolioId });
        if (!success) throw BadRequestError(error, { layer: ErrorLayer.APPLICATION });

        const portfolio = await this.portfolioRepository.findById(portfolioId);
        if (!portfolio) {
            return false;
        }

        return portfolio.userId === userId;
    }
}
