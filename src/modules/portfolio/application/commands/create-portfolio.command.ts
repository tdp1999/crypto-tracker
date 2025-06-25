import { BadRequestError } from '@core/errors/domain.error';
import { ErrorLayer } from '@core/errors/types/error-layer.type.error';
import { Id } from '@core/types/common.type';
import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Portfolio, PortfolioCreateSchema } from '../../domain/entities/portfolio.entity';
import { ERR_PORTFOLIO_NAME_EXISTS } from '../../domain/portfolio.error';
import { PORTFOLIO_TOKENS } from '../portfolio.token';
import { IPortfolioRepository } from '../ports/portfolio-repository.out.port';

export class CreatePortfolioCommand {
    constructor(public readonly payload: { dto: unknown; userId: Id }) {}
}

@Injectable()
@CommandHandler(CreatePortfolioCommand)
export class CreatePortfolioCommandHandler implements ICommandHandler<CreatePortfolioCommand> {
    constructor(
        @Inject(PORTFOLIO_TOKENS.REPOSITORIES.PORTFOLIO)
        private readonly portfolioRepository: IPortfolioRepository,
    ) {}

    async execute(command: CreatePortfolioCommand): Promise<Id> {
        const { dto, userId } = command.payload;
        const { success, data, error } = PortfolioCreateSchema.safeParse(dto);
        if (!success)
            throw BadRequestError(error, { layer: ErrorLayer.APPLICATION, remarks: 'Portfolio creation failed' });

        // Check name uniqueness per user
        const existingPortfolio = await this.portfolioRepository.findByUserAndName(userId, data.name);
        if (existingPortfolio) {
            throw BadRequestError(ERR_PORTFOLIO_NAME_EXISTS, {
                layer: ErrorLayer.APPLICATION,
                remarks: 'Portfolio creation failed',
            });
        }

        // Auto-set isDefault: true if user has no portfolios
        const userPortfolioCount = await this.portfolioRepository.countByUserId(userId);
        const portfolioData = {
            ...data,
            isDefault: userPortfolioCount === 0 ? true : (data.isDefault ?? false),
        };

        const portfolio = Portfolio.create(portfolioData, userId, userId);
        const portfolioId = await this.portfolioRepository.add(portfolio);

        return portfolioId;
    }
}
