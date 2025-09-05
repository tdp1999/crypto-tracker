import { FinancialGoal } from '../../domain/entities/financial-goal.entity';
import { FinancialGoalPersistence } from '../persistence/financial-goal.persistence';

export class FinancialGoalMapper {
    static toDomain(entity: FinancialGoalPersistence): FinancialGoal {
        return FinancialGoal.load({ ...entity });
    }

    static toDomainArray(entities: FinancialGoalPersistence[]): FinancialGoal[] {
        return entities.map((e) => this.toDomain(e));
    }
}
