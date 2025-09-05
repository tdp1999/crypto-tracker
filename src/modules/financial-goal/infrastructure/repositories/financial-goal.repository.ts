import { Id } from '@core/types/common.type';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { IFinancialGoalRepository } from '../../application/ports/financial-goal.port';
import { FinancialGoal } from '../../domain/entities/financial-goal.entity';
import { FinancialGoalMapper } from '../mapper/financial-goal.mapper';
import { FinancialGoalPersistence } from '../persistence/financial-goal.persistence';

export class FinancialGoalRepository implements IFinancialGoalRepository {
    constructor(
        @InjectRepository(FinancialGoalPersistence)
        private readonly repository: Repository<FinancialGoalPersistence>,

        private readonly dataSource: DataSource,
    ) {}

    async add(goal: FinancialGoal): Promise<Id> {
        const entity = this.repository.create(goal.props);
        const saved = await this.repository.save(entity);
        return saved.id;
    }

    async update(id: Id, entity: FinancialGoal): Promise<boolean> {
        const entityWithId = { ...entity.props, id };
        const instance = this.repository.create(entityWithId);
        await this.repository.save(instance);
        return true;
    }

    async remove(id: Id): Promise<boolean> {
        const result = await this.repository.softDelete({ id });
        return result.affected !== undefined && result.affected !== null && result.affected > 0;
    }

    async getActive(userId: Id): Promise<FinancialGoal> {
        const entity = await this.repository.findOne({ where: { userId, isActive: true } });
        if (!entity) throw new Error('Financial goal not found');
        return FinancialGoalMapper.toDomain(entity);
    }

    async findById(id: Id): Promise<FinancialGoal | null> {
        const entity = await this.repository.findOneBy({ id });
        return entity ? FinancialGoalMapper.toDomain(entity) : null;
    }

    async findByUserId(userId: Id): Promise<FinancialGoal[]> {
        const entities = await this.repository.findBy({ userId });
        return FinancialGoalMapper.toDomainArray(entities);
    }

    async activateGoalAndDeactivateOthers(id: string): Promise<void> {
        await this.dataSource.transaction(async (transactionalEntityManager) => {
            // Bước 1: Hủy kích hoạt TẤT CẢ các mục tiêu khác (trừ mục tiêu hiện tại)
            // Đây là một câu lệnh UPDATE duy nhất
            await transactionalEntityManager
                .createQueryBuilder()
                .update(FinancialGoalPersistence)
                .set({ isActive: false })
                .where('isActive = :isActive AND id != :currentGoalId', {
                    isActive: true,
                    currentGoalId: id,
                })
                .execute();

            // Bước 2: Kích hoạt mục tiêu được chỉ định
            // Đây là một câu lệnh UPDATE duy nhất
            // Có thể dùng findById và save, nhưng UPDATE trực tiếp sẽ hiệu quả hơn
            await transactionalEntityManager
                .createQueryBuilder()
                .update(FinancialGoalPersistence)
                .set({ isActive: true })
                .where('id = :goalId', { goalId: id })
                .execute();
        });
    }
}
