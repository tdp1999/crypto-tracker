import { BadRequestError } from '@core/errors/domain.error';
import { ErrorLayer } from '@core/errors/types/error-layer.type.error';
import { Id } from '@core/types/common.type';
import { Inject } from '@nestjs/common';
import { CommandHandler, ICommand, ICommandHandler } from '@nestjs/cqrs';
import { FinancialGoal } from '../../domain/entities/financial-goal.entity';
import { FINANCIAL_GOAL_TOKENS } from '../financial-goal.token';
import { IFinancialGoalRepository } from '../ports/financial-goal.port';
import { FinancialGoalCreateSchema } from '../schema/financial-goal.schema';

export class CreateFinancialGoalCommand implements ICommand {
    constructor(public readonly payload: { dto: unknown; userId: Id }) {}
}

@CommandHandler(CreateFinancialGoalCommand)
export class CreateFinancialGoalCommandHandler implements ICommandHandler<CreateFinancialGoalCommand, Id> {
    constructor(
        @Inject(FINANCIAL_GOAL_TOKENS.REPOSITORIES.GOAL)
        private readonly goalRepository: IFinancialGoalRepository,
    ) {}

    async execute(command: CreateFinancialGoalCommand): Promise<Id> {
        const { dto, userId } = command.payload;
        const { success, data, error } = FinancialGoalCreateSchema.safeParse(dto);
        if (!success)
            throw BadRequestError(error, {
                layer: ErrorLayer.APPLICATION,
                remarks: 'Financial goal creation failed',
            });

        const model = FinancialGoal.create(data, userId, userId);
        return await this.goalRepository.add(model);
    }
}
