import { withDefaultOrder } from '@core/builders/order.builder';
import { WhereBuilder } from '@core/builders/where.builder';
import { IUser, User } from '@core/features/user/user.entity';
import { applySelectClause } from '@core/factories/select.factory';
import { Id } from '@core/types/common.type';
import { FindByIdsResult } from '@core/types/query.type';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DEFAULT_LIMIT, DEFAULT_PAGE } from '@shared/constants/default.constant';
import { PaginatedResponse } from '@shared/types/pagination.type';
import { paginate } from '@shared/utils/pagination.util';
import { FindOptionsWhere, In, Repository, SelectQueryBuilder } from 'typeorm';
import { IUserRepository } from '../application/ports/user-repository.out.port';
import { UserQueryDto } from '../application/user.dto';
import { UserPersistence } from './user.persistence';

@Injectable()
export class UserRepository implements IUserRepository {
    constructor(
        @InjectRepository(UserPersistence)
        private readonly userRepository: Repository<UserPersistence>,
    ) {}

    // --- Public methods (IRepository implementation) ---
    async add(entity: User): Promise<Id> {
        const persistenceInstance = this.userRepository.create(entity);
        const savedEntity = await this.userRepository.save(persistenceInstance);
        return savedEntity.id;
    }

    async update(id: Id, entity: User): Promise<boolean> {
        try {
            const entityWithId = { ...entity, id };
            const persistenceInstance = this.userRepository.create(entityWithId);
            await this.userRepository.save(persistenceInstance);
            return true;
        } catch (error) {
            console.error('User update failed:', error);
            return false;
        }
    }

    async remove(id: Id): Promise<boolean> {
        const result = await this.userRepository.delete(id);
        return result.affected !== undefined && result.affected !== null && result.affected > 0;
    }

    async list(query?: UserQueryDto): Promise<User[]> {
        const alias = 'user';
        let qb = this.userRepository.createQueryBuilder(alias);

        if (query) {
            qb = this._buildWhereClause(qb, query, alias);
            qb = withDefaultOrder(qb, alias, query);
            qb = applySelectClause(qb, alias, query.visibleColumns);
        }

        const entities = await qb.getMany();
        return this._toDomainArray(entities);
    }

    async paginatedList(query?: UserQueryDto): Promise<PaginatedResponse<User>> {
        const page = query?.page ?? DEFAULT_PAGE;
        const limit = query?.limit ?? DEFAULT_LIMIT;
        const offset = (page - 1) * limit;

        const alias = 'user';
        let qb = this.userRepository.createQueryBuilder(alias);

        if (query) {
            qb = this._buildWhereClause(qb, query, alias);
            qb = withDefaultOrder(qb, alias, query);
            qb = applySelectClause(qb, alias, query.visibleColumns);
        }

        qb.skip(offset).take(limit);

        const [entities, total] = await qb.getManyAndCount();
        const items = this._toDomainArray(entities);
        return paginate(items, total, page, limit);
    }

    async findById(id: Id): Promise<User | null> {
        const entity = await this.userRepository.findOneBy({ id });
        return entity ? this._toDomain(entity) : null;
    }

    async findByIds(ids: Id[]): Promise<FindByIdsResult<User, Id>> {
        const entities = await this.userRepository.findBy({ id: In(ids) });
        const found = this._toDomainArray(entities);
        const foundIds = new Set(found.map((u) => u.id));
        const notFound = ids.filter((id) => !foundIds.has(id));
        return { found, notFound };
    }

    async findOne(conditions: Partial<IUser>): Promise<User | null> {
        const findConditions: FindOptionsWhere<UserPersistence> = conditions as FindOptionsWhere<UserPersistence>;
        const entity = await this.userRepository.findOneBy(findConditions);
        return entity ? this._toDomain(entity) : null;
    }

    async exists(id: Id): Promise<boolean> {
        const count = await this.userRepository.countBy({ id });
        return count > 0;
    }

    async getHashedPassword(id: Id): Promise<string | null> {
        const entity = await this.userRepository.findOne({ where: { id }, select: ['password'] });
        return entity?.password ?? null;
    }

    // --- Private helper methods ---
    private _toDomain(entity: UserPersistence): User {
        return User.fromPersistence(entity);
    }

    private _toDomainArray(entities: UserPersistence[]): User[] {
        return entities.map((entity) => this._toDomain(entity));
    }

    private _buildWhereClause(
        qb: SelectQueryBuilder<UserPersistence>,
        query: UserQueryDto,
        alias: string = 'user',
    ): SelectQueryBuilder<UserPersistence> {
        return WhereBuilder.create(qb, alias).like('email', query.email).equal('status', query.status).build();
    }
}
