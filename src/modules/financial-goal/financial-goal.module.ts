import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivateFinancialGoalCommandHandler } from './application/commands/activate-goal.command';
import { CreateFinancialGoalCommandHandler } from './application/commands/create-goal.command';
import { UpdateFinancialGoalCommandHandler } from './application/commands/update-goal.command';
import { FINANCIAL_GOAL_TOKENS } from './application/financial-goal.token';
import { ListFinancialGoalsQueryHandler } from './application/queries/list-goals.query';
import { FinancialGoalController } from './infrastructure/controllers/financial-goal.controller';
import { FinancialGoalPersistence } from './infrastructure/persistence/financial-goal.persistence';
import { FinancialGoalRepository } from './infrastructure/repositories/financial-goal.repository';

const QueryHandlers = [ListFinancialGoalsQueryHandler];
const CommandHandlers = [
    CreateFinancialGoalCommandHandler,
    ActivateFinancialGoalCommandHandler,
    UpdateFinancialGoalCommandHandler,
];

@Module({
    controllers: [FinancialGoalController],
    imports: [TypeOrmModule.forFeature([FinancialGoalPersistence]), CqrsModule],
    providers: [
        { provide: FINANCIAL_GOAL_TOKENS.REPOSITORIES.GOAL, useClass: FinancialGoalRepository },
        ...QueryHandlers,
        ...CommandHandlers,
    ],
    exports: [FINANCIAL_GOAL_TOKENS.REPOSITORIES.GOAL],
})
export class FinancialGoalModule {}
