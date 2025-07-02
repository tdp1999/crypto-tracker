import { withDefaultOrder } from '@core/builders/order.builder';
import { WhereBuilder } from '@core/builders/where.builder';
import { applySelectClause } from '@core/factories/select.factory';
import { Id } from '@core/types/common.type';
import { FindByIdsResult } from '@core/types/query.type';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DEFAULT_LIMIT, DEFAULT_PAGE } from '@shared/constants/default.constant';
import { PaginatedResponse } from '@shared/types/pagination.type';
import { paginate } from '@shared/utils/pagination.util';
import { FindOptionsWhere, In, IsNull, Repository, SelectQueryBuilder } from 'typeorm';
import { PortfolioHoldingQueryDto } from '../../application/portfolio.dto';
import { IPortfolioHoldingRepository } from '../../application/ports/portfolio-holding-repository.out.port';
import { IPortfolioHolding, PortfolioHolding } from '../../domain/entities/portfolio-holding.entity';
import { PortfolioHoldingPersistence } from '../persistence/portfolio-holding.persistence';

@Injectable()
export class PortfolioHoldingRepository implements IPortfolioHoldingRepository {
    constructor(
        @InjectRepository(PortfolioHoldingPersistence)
        private readonly holdingRepository: Repository<PortfolioHoldingPersistence>,
    ) {}

    // --- Public methods (IRepository implementation) ---
    async add(entity: PortfolioHolding): Promise<Id> {
        const persistenceInstance = this.holdingRepository.create(entity);
        const savedEntity = await this.holdingRepository.save(persistenceInstance);
        return savedEntity.id;
    }

    async update(id: Id, entity: PortfolioHolding): Promise<boolean> {
        try {
            const entityWithId = { ...entity, id };
            const persistenceInstance = this.holdingRepository.create(entityWithId);
            await this.holdingRepository.save(persistenceInstance);
            return true;
        } catch (error) {
            console.error('Portfolio holding update failed:', error);
            return false;
        }
    }

    async remove(id: Id): Promise<boolean> {
        const result = await this.holdingRepository.delete(id);
        return result.affected !== undefined && result.affected !== null && result.affected > 0;
    }

    async list(query?: PortfolioHoldingQueryDto): Promise<PortfolioHolding[]> {
        const alias = 'holding';
        let qb = this.holdingRepository.createQueryBuilder(alias);

        if (query) {
            qb = this._buildWhereClause(qb, query, alias);
            qb = withDefaultOrder(qb, alias, query);
            qb = applySelectClause(qb, alias, query.visibleColumns);
        }

        const entities = await qb.getMany();
        return this._toDomainArray(entities);
    }

    async paginatedList(query?: PortfolioHoldingQueryDto): Promise<PaginatedResponse<PortfolioHolding>> {
        const page = query?.page ?? DEFAULT_PAGE;
        const limit = query?.limit ?? DEFAULT_LIMIT;
        const offset = (page - 1) * limit;

        const alias = 'holding';
        let qb = this.holdingRepository.createQueryBuilder(alias);

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

    async findById(id: Id): Promise<PortfolioHolding | null> {
        const entity = await this.holdingRepository.findOneBy({ id });
        return entity ? this._toDomain(entity) : null;
    }

    async findByIds(ids: Id[]): Promise<FindByIdsResult<PortfolioHolding, Id>> {
        const entities = await this.holdingRepository.findBy({ id: In(ids) });
        const found = this._toDomainArray(entities);
        const foundIds = new Set(found.map((h) => h.id));
        const notFound = ids.filter((id) => !foundIds.has(id));
        return { found, notFound };
    }

    async findOne(conditions: Partial<IPortfolioHolding>): Promise<PortfolioHolding | null> {
        const findConditions: FindOptionsWhere<PortfolioHoldingPersistence> =
            conditions as FindOptionsWhere<PortfolioHoldingPersistence>;
        const entity = await this.holdingRepository.findOneBy(findConditions);
        return entity ? this._toDomain(entity) : null;
    }

    async exists(id: Id): Promise<boolean> {
        const count = await this.holdingRepository.countBy({ id });
        return count > 0;
    }

    // --- Custom methods (IPortfolioHoldingRepository specific) ---
    async findByPortfolioId(portfolioId: Id): Promise<PortfolioHolding[]> {
        const entities = await this.holdingRepository.findBy({ portfolioId });
        return this._toDomainArray(entities);
    }

    async findByPortfolioAndTokenSymbol(portfolioId: Id, refId: string): Promise<PortfolioHolding | null> {
        const entity = await this.holdingRepository.findOneBy({ portfolioId, refId });
        return entity ? this._toDomain(entity) : null;
    }

    /**
     * Efficiently check if a token already exists in portfolio without fetching full entity
     */
    async existsByPortfolioAndTokenSymbol(portfolioId: Id, refId: string): Promise<boolean> {
        const count = await this.holdingRepository.countBy({ portfolioId, refId, deletedAt: IsNull() });
        return count > 0;
    }

    async findActiveByPortfolioId(portfolioId: Id): Promise<PortfolioHolding[]> {
        const entities = await this.holdingRepository.findBy({
            portfolioId,
            deletedAt: IsNull(),
        });
        return this._toDomainArray(entities);
    }

    // --- Private helper methods ---
    private _toDomain(entity: PortfolioHoldingPersistence): PortfolioHolding {
        return PortfolioHolding.fromPersistence(entity);
    }

    private _toDomainArray(entities: PortfolioHoldingPersistence[]): PortfolioHolding[] {
        return entities.map((entity) => this._toDomain(entity));
    }

    private _buildWhereClause(
        qb: SelectQueryBuilder<PortfolioHoldingPersistence>,
        query: PortfolioHoldingQueryDto,
        alias: string = 'holding',
    ): SelectQueryBuilder<PortfolioHoldingPersistence> {
        return WhereBuilder.create(qb, alias)
            .equal('portfolioId', query.portfolioId)
            .equal('tokenSymbol', query.tokenSymbol)
            .equal('isStablecoin', query.isStablecoin)
            .build();
    }
}
