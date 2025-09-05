import { FinancialGoalAction } from '@core/actions/financial-goal.action';
import { RpcExceptionFilter } from '@core/filters/rpc-exception.filter';
import { Controller, Inject, UseFilters } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { FINANCIAL_GOAL_TOKENS } from '../application/financial-goal.token';
import { IFinancialGoalRepository } from '../application/ports/financial-goal.port';

@Controller()
@UseFilters(RpcExceptionFilter)
export class FinancialGoalRpcController {
    constructor(
        @Inject(FINANCIAL_GOAL_TOKENS.REPOSITORIES.GOAL) private readonly goalRepository: IFinancialGoalRepository,
    ) {}

    @MessagePattern(FinancialGoalAction.GET_ACTIVE)
    async getActive(payload: { userId: string }) {
        return this.goalRepository.getActive(payload.userId);
    }
}
