import { BadRequestError } from '@core/errors/domain.error';
import { ErrorLayer } from '@core/errors/types/error-layer.type.error';
import { Id } from '@core/types/common.type';
import { Inject } from '@nestjs/common';
import { IQuery, IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { FinancialGoalQueryDto } from '../financial-goal.dto';
import { FINANCIAL_GOAL_TOKENS } from '../financial-goal.token';
import { IFinancialGoalRepository } from '../ports/financial-goal.port';
import { FinancialGoalQuerySchema } from '../schema/financial-goal.schema';

export class ListFinancialGoalsQuery implements IQuery {
    constructor(public readonly payload: { dto: FinancialGoalQueryDto; userId: Id }) {}
}

@QueryHandler(ListFinancialGoalsQuery)
export class ListFinancialGoalsQueryHandler implements IQueryHandler<ListFinancialGoalsQuery, unknown[]> {
    constructor(
        @Inject(FINANCIAL_GOAL_TOKENS.REPOSITORIES.GOAL)
        private readonly goalRepository: IFinancialGoalRepository,
    ) {}

    async execute(query: ListFinancialGoalsQuery) {
        const { dto, userId } = query.payload;

        // Validate payload
        const { success, error } = FinancialGoalQuerySchema.safeParse(dto);
        if (!success) throw BadRequestError(error, { layer: ErrorLayer.APPLICATION });

        const list = await this.goalRepository.findByUserId(userId);
        return list.map((goal) => goal.props);
    }
}
