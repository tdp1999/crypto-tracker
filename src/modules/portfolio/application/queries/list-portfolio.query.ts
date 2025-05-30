import { BadRequestError } from '@core/errors/domain.error';
import { ErrorLayer } from '@core/errors/types/error-layer.type.error';
import { Id } from '@core/types/common.type';
import { Inject, Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PaginatedResponse } from '@shared/types/pagination.type';
import { Portfolio } from '../../domain/portfolio.entity';
import { PortfolioQuerySchema } from '../portfolio.dto';
import { PORTFOLIO_TOKENS } from '../portfolio.token';
import { IPortfolioRepository } from '../ports/portfolio-repository.out.port';

export class PortfolioListQuery {
    constructor(public readonly payload: { dto: unknown; userId: Id }) {}
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
        const { success, error, data } = PortfolioQuerySchema.safeParse(dto);
        if (!success) throw BadRequestError(error, { layer: ErrorLayer.APPLICATION });

        // Auto-filter by userId for security
        const validatedDto = { ...data, userId };

        return this.portfolioRepository.paginatedList(validatedDto);
    }
}
