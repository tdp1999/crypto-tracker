import { BasePersistence } from '@core/abstractions/persistence.base';
import { Column, Entity, Index } from 'typeorm';

@Entity('financial_goals')
@Index('IDX_financial_goals_user_id', ['userId'])
@Index('IDX_financial_goals_active', ['userId', 'isActive'])
export class FinancialGoalPersistence extends BasePersistence {
    @Column({ name: 'user_id', type: 'uuid' })
    userId: string;

    @Column({ name: 'name', type: 'varchar', length: 255 })
    name: string;

    @Column({ name: 'target_date', type: 'date' })
    targetDate: string;

    @Column({ name: 'is_active', type: 'boolean', default: false })
    isActive: boolean;
}
