import { BadRequestError, NotFoundError } from '@core/errors/domain.error';
import { ErrorLayer } from '@core/errors/types/error-layer.type.error';
import { Id } from '@core/types/common.type';
import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Portfolio, PortfolioUpdateSchema } from '../../domain/portfolio.entity';
import {
    ERR_PORTFOLIO_ACCESS_DENIED,
    ERR_PORTFOLIO_CANNOT_UNSET_DEFAULT,
    ERR_PORTFOLIO_NAME_EXISTS,
    ERR_PORTFOLIO_NOT_FOUND,
} from '../../domain/portfolio.error';
import { PORTFOLIO_TOKENS } from '../portfolio.token';
import { IPortfolioRepository } from '../ports/portfolio-repository.out.port';

export class UpdatePortfolioCommand {
    constructor(public readonly payload: { id: Id; dto: unknown; userId: Id }) {}
}

@Injectable()
@CommandHandler(UpdatePortfolioCommand)
export class UpdatePortfolioCommandHandler implements ICommandHandler<UpdatePortfolioCommand> {
    constructor(
        @Inject(PORTFOLIO_TOKENS.REPOSITORIES)
        private readonly portfolioRepository: IPortfolioRepository,
    ) {}

    async execute(command: UpdatePortfolioCommand): Promise<boolean> {
        const { id, dto, userId } = command.payload;
        const { success, data, error } = PortfolioUpdateSchema.safeParse(dto);
        if (!success)
            throw BadRequestError(error, { layer: ErrorLayer.APPLICATION, remarks: 'Portfolio update failed' });

        // Validate ownership
        const existingPortfolio = await this.portfolioRepository.findById(id);
        if (!existingPortfolio) {
            throw NotFoundError(ERR_PORTFOLIO_NOT_FOUND, { layer: ErrorLayer.APPLICATION });
        }

        if (existingPortfolio.userId !== userId) {
            throw BadRequestError(ERR_PORTFOLIO_ACCESS_DENIED, {
                layer: ErrorLayer.APPLICATION,
                remarks: 'Portfolio update failed',
            });
        }

        // Check name uniqueness if name is being updated
        if (data.name && data.name !== existingPortfolio.name) {
            const portfolioWithSameName = await this.portfolioRepository.findByUserAndName(userId, data.name);
            if (portfolioWithSameName) {
                throw BadRequestError(ERR_PORTFOLIO_NAME_EXISTS, {
                    layer: ErrorLayer.APPLICATION,
                    remarks: 'Portfolio update failed',
                });
            }
        }

        // Prevent unsetting isDefault if it's the only portfolio
        if (data.isDefault === false && existingPortfolio.isDefault) {
            const userPortfolioCount = await this.portfolioRepository.countByUserId(userId);
            if (userPortfolioCount === 1) {
                throw BadRequestError(ERR_PORTFOLIO_CANNOT_UNSET_DEFAULT, {
                    layer: ErrorLayer.APPLICATION,
                    remarks: 'Portfolio update failed',
                });
            }
        }

        // Use domain entity to apply updates with domain logic
        const updatedPortfolio = Portfolio.update(existingPortfolio, data, userId);

        // Pass full entity directly to repository
        return await this.portfolioRepository.update(id, updatedPortfolio);
    }
}
