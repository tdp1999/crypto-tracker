import { BadRequestError, NotFoundError } from '@core/errors/domain.error';
import { ErrorLayer } from '@core/errors/types/error-layer.type.error';
import { Id } from '@core/types/common.type';
import { Inject } from '@nestjs/common';
import { CommandHandler, ICommand, ICommandHandler } from '@nestjs/cqrs';
import { FinancialGoal } from '../../domain/entities/financial-goal.entity';
import { ERR_FINANCIAL_GOAL_ACCESS_DENIED, ERR_FINANCIAL_GOAL_NOT_FOUND } from '../financial-goal.error';
import { FINANCIAL_GOAL_TOKENS } from '../financial-goal.token';
import { IFinancialGoalRepository } from '../ports/financial-goal.port';
import { FinancialGoalUpdateSchema } from '../schema/financial-goal.schema';

export class UpdateFinancialGoalCommand implements ICommand {
    constructor(public readonly payload: { id: Id; dto: unknown; userId: Id }) {}
}

@CommandHandler(UpdateFinancialGoalCommand)
export class UpdateFinancialGoalCommandHandler implements ICommandHandler<UpdateFinancialGoalCommand, boolean> {
    constructor(
        @Inject(FINANCIAL_GOAL_TOKENS.REPOSITORIES.GOAL)
        private readonly goalRepository: IFinancialGoalRepository,
    ) {}

    async execute(command: UpdateFinancialGoalCommand): Promise<boolean> {
        const { id, dto, userId } = command.payload;

        // Validate payload
        const { success, error, data } = FinancialGoalUpdateSchema.safeParse(dto);
        if (!success)
            throw BadRequestError(error, {
                layer: ErrorLayer.APPLICATION,
                remarks: 'Financial goal update failed',
            });

        // Get existing goal
        const existing = await this.goalRepository.findById(id);
        if (!existing) throw NotFoundError(ERR_FINANCIAL_GOAL_NOT_FOUND, { layer: ErrorLayer.APPLICATION });

        // Validate ownership
        if (existing.props.userId !== userId)
            throw BadRequestError(ERR_FINANCIAL_GOAL_ACCESS_DENIED, { layer: ErrorLayer.APPLICATION });

        const updated: FinancialGoal = existing.update(data, userId);
        return await this.goalRepository.update(id, updated);
    }
}
