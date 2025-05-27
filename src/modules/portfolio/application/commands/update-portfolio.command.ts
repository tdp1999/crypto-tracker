import { BadRequestError, NotFoundError } from '@core/errors/domain.error';
import { ErrorLayer } from '@core/errors/types/error-layer.type.error';
import { PortfolioUpdateSchema } from '../../domain/portfolio.entity';
import {
    ERR_PORTFOLIO_ACCESS_DENIED,
    ERR_PORTFOLIO_CANNOT_UNSET_DEFAULT,
    ERR_PORTFOLIO_NAME_EXISTS,
    ERR_PORTFOLIO_NOT_FOUND,
} from '../../domain/portfolio.error';
import { Id } from '@core/types/common.type';
import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { IPortfolioRepository } from '../ports/portfolio-repository.out.port';
import { PortfolioUpdateDto } from '../portfolio.dto';
import { PORTFOLIO_TOKENS } from '../portfolio.token';

export class UpdatePortfolioCommand {
    constructor(public readonly payload: { id: Id; dto: PortfolioUpdateDto; userId: Id }) {}
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

        // Filter out null values and audit fields that shouldn't be updated directly
        const updateData = Object.fromEntries(
            Object.entries(data).filter(
                ([key, value]) =>
                    value !== null && !['createdAt', 'createdById', 'deletedAt', 'deletedById'].includes(key),
            ),
        ) as PortfolioUpdateDto;

        return await this.portfolioRepository.update(id, updateData);
    }
}
