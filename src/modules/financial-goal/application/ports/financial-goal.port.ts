import { Id } from '@core/types/common.type';
import { FinancialGoal } from '../../domain/entities/financial-goal.entity';
import { IRepositoryCommand } from '@core/interfaces/repository.interface';

export type IFinancialGoalRepository = IRepositoryCommand<FinancialGoal> & {
    activateGoalAndDeactivateOthers(id: Id): Promise<void>;

    getActive(userId: Id): Promise<FinancialGoal>;
    findById(id: Id): Promise<FinancialGoal | null>;
    findByUserId(userId: Id): Promise<FinancialGoal[]>;
};
