import { Portfolio } from '../../domain/portfolio.entity';
import { BadRequestError } from '@core/errors/domain.error';
import { ErrorLayer } from '@core/errors/types/error-layer.type.error';
import { Id } from '@core/types/common.type';
import { Inject, Injectable } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { PaginatedResponse } from '@shared/types/pagination.type';
import { IPortfolioRepository } from '../ports/portfolio-repository.out.port';
import { PortfolioQueryDto, PortfolioQuerySchema } from '../portfolio.dto';
import { PORTFOLIO_TOKENS } from '../portfolio.token';

export class PortfolioListQuery {
    constructor(public readonly payload: { dto: PortfolioQueryDto; userId: Id }) {}
}

@Injectable()
@QueryHandler(PortfolioListQuery)
export class ListPortfolioQueryHandler implements IQueryHandler<PortfolioListQuery, PaginatedResponse<Portfolio>> {
    constructor(
        @Inject(PORTFOLIO_TOKENS.REPOSITORIES)
        private readonly portfolioRepository: IPortfolioRepository,
    ) {}

    async execute(query: PortfolioListQuery): Promise<PaginatedResponse<Portfolio>> {
        const { dto, userId } = query.payload;

        // Auto-filter by userId for security
        const queryWithUserFilter = { ...dto, userId };

        const { success, error, data: validatedDto } = PortfolioQuerySchema.safeParse(queryWithUserFilter);
        if (!success) throw BadRequestError(error, { layer: ErrorLayer.APPLICATION });

        return this.portfolioRepository.paginatedList(validatedDto);
    }
}
