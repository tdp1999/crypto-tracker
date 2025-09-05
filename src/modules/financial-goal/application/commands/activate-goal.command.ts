import { BadRequestError, NotFoundError } from '@core/errors/domain.error';
import { ErrorLayer } from '@core/errors/types/error-layer.type.error';
import { DetailQuerySchema } from '@core/schema/query.schema';
import { Id } from '@core/types/common.type';
import { Inject } from '@nestjs/common';
import { CommandHandler, ICommand, ICommandHandler } from '@nestjs/cqrs';
import { ERR_FINANCIAL_GOAL_ACCESS_DENIED, ERR_FINANCIAL_GOAL_NOT_FOUND } from '../financial-goal.error';
import { FINANCIAL_GOAL_TOKENS } from '../financial-goal.token';
import { IFinancialGoalRepository } from '../ports/financial-goal.port';

export const ActivateFinancialGoalSchema = DetailQuerySchema;

export class ActivateFinancialGoalCommand implements ICommand {
    constructor(public readonly payload: { dto: unknown; userId: Id }) {}
}

@CommandHandler(ActivateFinancialGoalCommand)
export class ActivateFinancialGoalCommandHandler implements ICommandHandler<ActivateFinancialGoalCommand, boolean> {
    constructor(
        @Inject(FINANCIAL_GOAL_TOKENS.REPOSITORIES.GOAL)
        private readonly goalRepository: IFinancialGoalRepository,
    ) {}

    async execute(command: ActivateFinancialGoalCommand): Promise<boolean> {
        const { dto, userId } = command.payload;

        // Validate payload
        const { success, error, data } = ActivateFinancialGoalSchema.safeParse(dto);
        if (!success) throw BadRequestError(error, { layer: ErrorLayer.APPLICATION });

        // Get existing goal
        const existing = await this.goalRepository.findById(data.id);
        if (!existing) throw NotFoundError(ERR_FINANCIAL_GOAL_NOT_FOUND, { layer: ErrorLayer.APPLICATION });

        // Validate ownership
        if (existing.props.userId !== userId)
            throw BadRequestError(ERR_FINANCIAL_GOAL_ACCESS_DENIED, { layer: ErrorLayer.APPLICATION });

        // Activate goal and deactivate others
        await this.goalRepository.activateGoalAndDeactivateOthers(data.id);
        return true;
    }
}
