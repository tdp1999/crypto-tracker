import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinancialGoalController } from './infrastructure/controllers/financial-goal.controller';
import { FinancialGoalPersistence } from './infrastructure/persistence/financial-goal.persistence';
import { FINANCIAL_GOAL_TOKENS } from './application/financial-goal.token';
import { FinancialGoalRepository } from './infrastructure/repositories/financial-goal.repository';
import { CreateFinancialGoalCommandHandler } from './application/commands/create-goal.command';
import { ActivateFinancialGoalCommandHandler } from './application/commands/activate-goal.command';
import { ListFinancialGoalsQueryHandler } from './application/queries/list-goals.query';

@Module({
    controllers: [FinancialGoalController],
    imports: [TypeOrmModule.forFeature([FinancialGoalPersistence]), CqrsModule],
    providers: [
        { provide: FINANCIAL_GOAL_TOKENS.REPOSITORIES.GOAL, useClass: FinancialGoalRepository },
        CreateFinancialGoalCommandHandler,
        ActivateFinancialGoalCommandHandler,
        ListFinancialGoalsQueryHandler,
    ],
    exports: [FINANCIAL_GOAL_TOKENS.REPOSITORIES.GOAL],
})
export class FinancialGoalModule {}
