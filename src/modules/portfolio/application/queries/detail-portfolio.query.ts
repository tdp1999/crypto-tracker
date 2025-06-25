import { BadRequestError, NotFoundError } from '@core/errors/domain.error';
import { ErrorLayer } from '@core/errors/types/error-layer.type.error';
import { DetailQuerySchema } from '@core/schema/query.schema';
import { Id } from '@core/types/common.type';
import { Inject, Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Portfolio } from '../../domain/entities/portfolio.entity';
import { ERR_PORTFOLIO_NOT_FOUND } from '../../domain/portfolio.error';
import { PortfolioOwnershipService } from '../../domain/services/portfolio-ownership.service';
import { PORTFOLIO_TOKENS } from '../portfolio.token';
import { IPortfolioRepository } from '../ports/portfolio-repository.out.port';

export class PortfolioDetailQuery {
    constructor(public readonly payload: { id: Id; userId: Id }) {}
}

@Injectable()
@QueryHandler(PortfolioDetailQuery)
export class DetailPortfolioQueryHandler implements IQueryHandler<PortfolioDetailQuery, Portfolio> {
    constructor(
        @Inject(PORTFOLIO_TOKENS.REPOSITORIES.PORTFOLIO)
        private readonly portfolioRepository: IPortfolioRepository,
    ) {}

    async execute(query: PortfolioDetailQuery): Promise<Portfolio> {
        const { id, userId } = query.payload;
        const { success, error } = DetailQuerySchema.safeParse({ id });
        if (!success) throw BadRequestError(error, { layer: ErrorLayer.APPLICATION });

        const portfolio = await this.portfolioRepository.findById(id);
        if (!portfolio) {
            throw NotFoundError(ERR_PORTFOLIO_NOT_FOUND, { layer: ErrorLayer.APPLICATION });
        }
        PortfolioOwnershipService.verifyOwnership(portfolio, userId);

        return portfolio;
    }
}
