import { Id } from '@core/types/common.type';
import { IQuery, IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { FINANCIAL_GOAL_TOKENS } from '../financial-goal.token';
import { FinancialGoal } from '../../domain/entities/financial-goal.entity';
import { IFinancialGoalRepository } from '../ports/financial-goal.port';
import { BadRequestError } from '@core/errors/domain.error';
import { ErrorLayer } from '@core/errors/types/error-layer.type.error';
import { FinancialGoalQueryDto, FinancialGoalQuerySchema } from '../financial-goal.dto';

export class ListFinancialGoalsQuery implements IQuery {
    constructor(public readonly payload: { dto: FinancialGoalQueryDto; userId: Id }) {}
}

@QueryHandler(ListFinancialGoalsQuery)
export class ListFinancialGoalsQueryHandler implements IQueryHandler<ListFinancialGoalsQuery, FinancialGoal[]> {
    constructor(
        @Inject(FINANCIAL_GOAL_TOKENS.REPOSITORIES.GOAL)
        private readonly goalRepository: IFinancialGoalRepository,
    ) {}

    async execute(query: ListFinancialGoalsQuery) {
        const { dto, userId } = query.payload;

        // Validate payload
        const { success, error } = FinancialGoalQuerySchema.safeParse(dto);
        if (!success) throw BadRequestError(error, { layer: ErrorLayer.APPLICATION });

        return await this.goalRepository.findByUserId(userId);
    }
}
