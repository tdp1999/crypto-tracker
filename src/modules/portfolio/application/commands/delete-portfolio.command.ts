import { BadRequestError, NotFoundError } from '@core/errors/domain.error';
import { ErrorLayer } from '@core/errors/types/error-layer.type.error';
import {
    ERR_PORTFOLIO_ACCESS_DENIED,
    ERR_PORTFOLIO_CANNOT_DELETE_DEFAULT,
    ERR_PORTFOLIO_NOT_FOUND,
} from '../../domain/portfolio.error';
import { Id } from '@core/types/common.type';
import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { IPortfolioRepository } from '../ports/portfolio-repository.out.port';
import { PORTFOLIO_TOKENS } from '../portfolio.token';

export class DeletePortfolioCommand {
    constructor(public readonly payload: { id: Id; userId: Id }) {}
}

@Injectable()
@CommandHandler(DeletePortfolioCommand)
export class DeletePortfolioCommandHandler implements ICommandHandler<DeletePortfolioCommand> {
    constructor(
        @Inject(PORTFOLIO_TOKENS.REPOSITORIES)
        private readonly portfolioRepository: IPortfolioRepository,
    ) {}

    async execute(command: DeletePortfolioCommand): Promise<boolean> {
        const { id, userId } = command.payload;

        // Validate ownership
        const existingPortfolio = await this.portfolioRepository.findById(id);
        if (!existingPortfolio) {
            throw NotFoundError(ERR_PORTFOLIO_NOT_FOUND, { layer: ErrorLayer.APPLICATION });
        }

        if (existingPortfolio.userId !== userId) {
            throw BadRequestError(ERR_PORTFOLIO_ACCESS_DENIED, {
                layer: ErrorLayer.APPLICATION,
                remarks: 'Portfolio deletion failed',
            });
        }

        // Prevent deletion of default portfolio if assets exist
        // Note: This check would need to be implemented when Asset module is available
        // For now, we'll allow deletion but this is where the check would go
        if (existingPortfolio.isDefault) {
            // TODO: Check if portfolio has assets via Asset module API
            // For now, we'll prevent deletion of default portfolios entirely
            throw BadRequestError(ERR_PORTFOLIO_CANNOT_DELETE_DEFAULT, {
                layer: ErrorLayer.APPLICATION,
                remarks: 'Portfolio deletion failed',
            });
        }

        // Soft delete implementation
        return await this.portfolioRepository.remove(id);
    }
}
