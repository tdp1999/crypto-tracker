import { Portfolio } from '../../domain/portfolio.entity';
import { BadRequestError, NotFoundError } from '@core/errors/domain.error';
import { ErrorLayer } from '@core/errors/types/error-layer.type.error';
import { ERR_PORTFOLIO_ACCESS_DENIED, ERR_PORTFOLIO_NOT_FOUND } from '../../domain/portfolio.error';
import { DetailQuerySchema } from '@core/schema/query.schema';
import { Id } from '@core/types/common.type';
import { Inject, Injectable } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { IPortfolioRepository } from '../ports/portfolio-repository.out.port';
import { PORTFOLIO_TOKENS } from '../portfolio.token';

export class PortfolioDetailQuery {
    constructor(public readonly payload: { id: Id; userId: Id }) {}
}

@Injectable()
@QueryHandler(PortfolioDetailQuery)
export class DetailPortfolioQueryHandler implements IQueryHandler<PortfolioDetailQuery, Portfolio> {
    constructor(
        @Inject(PORTFOLIO_TOKENS.REPOSITORIES)
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

        // Check ownership before returning data
        if (portfolio.userId !== userId) {
            throw BadRequestError(ERR_PORTFOLIO_ACCESS_DENIED, {
                layer: ErrorLayer.APPLICATION,
                remarks: 'Portfolio access denied',
            });
        }

        return portfolio;
    }
}
