import { BadRequestError } from '@core/errors/domain.error';
import { ErrorLayer } from '@core/errors/types/error-layer.type.error';
import { IdSchema } from '@core/schema/common.schema';
import { Id } from '@core/types/common.type';
import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { z } from 'zod';
import { PortfolioHolding } from '../../domain/entities/portfolio-holding.entity';
import { PortfolioOwnershipService } from '../../domain/services/portfolio-ownership.service';
import { TokenClassificationService } from '../../domain/services/token-classification.service';
import { PORTFOLIO_TOKENS } from '../portfolio.token';
import { IPortfolioHoldingRepository } from '../ports/portfolio-holding-repository.out.port';
import { IPortfolioProviderRepository } from '../ports/portfolio-provider-repository.out.port';
import { IPortfolioRepository } from '../ports/portfolio-repository.out.port';

export const RegisterTokenCommandSchema = z.object({ refId: IdSchema });

export class RegisterTokenCommand {
    constructor(public readonly payload: { dto: unknown; userId: Id; portfolioId: Id }) {}
}

@Injectable()
@CommandHandler(RegisterTokenCommand)
export class RegisterTokenCommandHandler implements ICommandHandler<RegisterTokenCommand> {
    constructor(
        @Inject(PORTFOLIO_TOKENS.REPOSITORIES.PORTFOLIO)
        private readonly portfolioRepository: IPortfolioRepository,

        @Inject(PORTFOLIO_TOKENS.REPOSITORIES.PORTFOLIO_HOLDING)
        private readonly portfolioHoldingRepository: IPortfolioHoldingRepository,

        @Inject(PORTFOLIO_TOKENS.REPOSITORIES.PORTFOLIO_PROVIDER)
        private readonly providerRepository: IPortfolioProviderRepository,
    ) {}

    async execute(command: RegisterTokenCommand): Promise<Id> {
        // Validate command
        const { dto, userId, portfolioId } = command.payload;
        const { success, error, data } = RegisterTokenCommandSchema.safeParse(dto);
        if (!success) {
            throw BadRequestError(error, { layer: ErrorLayer.APPLICATION });
        }

        // Verify portfolio exists and user has access
        const portfolio = await this.portfolioRepository.findById(portfolioId);
        PortfolioOwnershipService.verifyOwnership(portfolio, userId);

        // Fetch token metadata from provider
        const tokenDetails = await this.providerRepository.getTokenDetails(data.refId);
        const symbol = tokenDetails.symbol;

        if (!tokenDetails) {
            throw BadRequestError(`Token ${data.refId} not found`, { layer: ErrorLayer.APPLICATION });
        }

        // Get detailed token information
        const tokenData = {
            refId: tokenDetails.id,
            tokenSymbol: symbol,
            tokenName: tokenDetails.name,
            tokenDecimals: 18,
            tokenLogoUrl: tokenDetails.logo,
            isStablecoin: TokenClassificationService.isStablecoin(symbol),
            stablecoinPeg: TokenClassificationService.getStablecoinPeg(symbol),
        };

        // Create portfolio holding with enhanced token data
        const holding = PortfolioHolding.create({ portfolioId, ...tokenData }, userId);
        const holdingId = await this.portfolioHoldingRepository.add(holding);
        return holdingId;
    }
}
