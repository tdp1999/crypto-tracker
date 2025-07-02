import { BadRequestError, NotFoundError } from '@core/errors/domain.error';
import { ErrorLayer } from '@core/errors/types/error-layer.type.error';
import { IdSchema } from '@core/schema/common.schema';
import { Id } from '@core/types/common.type';
import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { z } from 'zod';
import { PortfolioHolding } from '../../domain/entities/portfolio-holding.entity';
import {
    ERR_HOLDING_ACCESS_DENIED,
    ERR_HOLDING_ALREADY_REMOVED,
    ERR_HOLDING_NOT_FOUND,
} from '../../domain/portfolio.error';
import { PortfolioOwnershipService } from '../../domain/services/portfolio-ownership.service';
import { PORTFOLIO_TOKENS } from '../portfolio.token';
import { IPortfolioHoldingRepository } from '../ports/portfolio-holding-repository.out.port';
import { IPortfolioRepository } from '../ports/portfolio-repository.out.port';

export const RemoveTokenCommandSchema = z.object({ holdingId: IdSchema });

export class RemoveTokenCommand {
    constructor(public readonly payload: { dto: unknown; userId: Id; portfolioId: Id }) {}
}

@Injectable()
@CommandHandler(RemoveTokenCommand)
export class RemoveTokenCommandHandler implements ICommandHandler<RemoveTokenCommand> {
    constructor(
        @Inject(PORTFOLIO_TOKENS.REPOSITORIES.PORTFOLIO)
        private readonly portfolioRepository: IPortfolioRepository,

        @Inject(PORTFOLIO_TOKENS.REPOSITORIES.PORTFOLIO_HOLDING)
        private readonly portfolioHoldingRepository: IPortfolioHoldingRepository,
    ) {}

    async execute(command: RemoveTokenCommand): Promise<boolean> {
        // Validate command
        const { dto, userId, portfolioId } = command.payload;
        const { success, error, data } = RemoveTokenCommandSchema.safeParse(dto);
        if (!success) {
            throw BadRequestError(error, { layer: ErrorLayer.APPLICATION });
        }

        const { holdingId } = data;

        // Get portfolio id from holding id and verify ownership
        const portfolioData = await this.portfolioRepository.getOwnershipData(portfolioId);
        PortfolioOwnershipService.verifyOwnership(portfolioData, userId);

        // Find the holding
        const holding = await this.portfolioHoldingRepository.findById(holdingId);
        if (!holding) throw NotFoundError(ERR_HOLDING_NOT_FOUND, { layer: ErrorLayer.APPLICATION });

        // Check if the portfolio is really the one that the holding belongs to
        if (holding.portfolioId !== portfolioId) {
            throw BadRequestError(ERR_HOLDING_ACCESS_DENIED, { layer: ErrorLayer.APPLICATION });
        }

        // Check if holding is already deleted
        if (!holding.isActive()) throw BadRequestError(ERR_HOLDING_ALREADY_REMOVED, { layer: ErrorLayer.APPLICATION });

        // Soft delete the holding (preserves transaction history)
        const deletedHolding = PortfolioHolding.markDeleted(holding, userId);
        await this.portfolioHoldingRepository.update(holdingId, deletedHolding);

        return true;
    }
}
