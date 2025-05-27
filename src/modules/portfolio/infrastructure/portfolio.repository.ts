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
import { FindOptionsWhere, In, Repository, SelectQueryBuilder } from 'typeorm';
import { IPortfolioRepository } from '../application/ports/portfolio-repository.out.port';
import { PortfolioCreateDto, PortfolioQueryDto, PortfolioUpdateDto } from '../application/portfolio.dto';
import { IPortfolio, Portfolio } from '../domain/portfolio.entity';
import { PortfolioEntity } from './portfolio.persistence';

@Injectable()
export class PortfolioRepository implements IPortfolioRepository {
    constructor(
        @InjectRepository(PortfolioEntity)
        private readonly portfolioRepository: Repository<PortfolioEntity>,
    ) {}

    // --- Public methods (IRepository implementation) ---
    async add(data: PortfolioCreateDto): Promise<Id> {
        const portfolioEntity = this.portfolioRepository.create(data);
        const saved = await this.portfolioRepository.save(portfolioEntity);
        return saved.id;
    }

    async update(id: Id, data: PortfolioUpdateDto): Promise<boolean> {
        const result = await this.portfolioRepository.update(id, data);
        return result.affected !== undefined && result.affected !== null && result.affected > 0;
    }

    async remove(id: Id): Promise<boolean> {
        const result = await this.portfolioRepository.delete(id);
        return result.affected !== undefined && result.affected !== null && result.affected > 0;
    }

    async list(query?: PortfolioQueryDto): Promise<Portfolio[]> {
        const alias = 'portfolio';
        let qb = this.portfolioRepository.createQueryBuilder(alias);

        if (query) {
            qb = this._buildWhereClause(qb, query, alias);
            qb = withDefaultOrder(qb, alias, query);
            qb = applySelectClause(qb, alias, query.visibleColumns);
        }

        const entities = await qb.getMany();
        return this._toDomainArray(entities);
    }

    async paginatedList(query?: PortfolioQueryDto): Promise<PaginatedResponse<Portfolio>> {
        const page = query?.page ?? DEFAULT_PAGE;
        const limit = query?.limit ?? DEFAULT_LIMIT;
        const offset = (page - 1) * limit;

        const alias = 'portfolio';
        let qb = this.portfolioRepository.createQueryBuilder(alias);

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

    async findById(id: Id): Promise<Portfolio | null> {
        const entity = await this.portfolioRepository.findOneBy({ id });
        return entity ? this._toDomain(entity) : null;
    }

    async findByIds(ids: Id[]): Promise<FindByIdsResult<Portfolio, Id>> {
        const entities = await this.portfolioRepository.findBy({ id: In(ids) });
        const found = this._toDomainArray(entities);
        const foundIds = new Set(found.map((p) => p.id));
        const notFound = ids.filter((id) => !foundIds.has(id));
        return { found, notFound };
    }

    async findOne(conditions: Partial<IPortfolio>): Promise<Portfolio | null> {
        const findConditions: FindOptionsWhere<PortfolioEntity> = conditions as FindOptionsWhere<PortfolioEntity>;
        const entity = await this.portfolioRepository.findOneBy(findConditions);
        return entity ? this._toDomain(entity) : null;
    }

    async exists(id: Id): Promise<boolean> {
        const count = await this.portfolioRepository.countBy({ id });
        return count > 0;
    }

    // --- Custom methods (IPortfolioRepository specific) ---
    async findByUserAndName(userId: Id, name: string): Promise<Portfolio | null> {
        const entity = await this.portfolioRepository.findOneBy({ userId, name });
        return entity ? this._toDomain(entity) : null;
    }

    async countByUserId(userId: Id): Promise<number> {
        return await this.portfolioRepository.countBy({ userId });
    }

    async findDefaultByUserId(userId: Id): Promise<Portfolio | null> {
        const entity = await this.portfolioRepository.findOneBy({ userId, isDefault: true });
        return entity ? this._toDomain(entity) : null;
    }

    // --- Private helper methods ---
    private _toDomain(entity: PortfolioEntity): Portfolio {
        // Simplified mapping - consider proper mapping if Portfolio has complex logic
        return entity as unknown as Portfolio;
    }

    private _toDomainArray(entities: PortfolioEntity[]): Portfolio[] {
        return entities.map((entity) => this._toDomain(entity));
    }

    private _buildWhereClause(
        qb: SelectQueryBuilder<PortfolioEntity>,
        query: PortfolioQueryDto,
        alias: string = 'portfolio',
    ): SelectQueryBuilder<PortfolioEntity> {
        return WhereBuilder.create(qb, alias)
            .like('name', query.name)
            .equal('userId', query.userId)
            .equal('isDefault', query.isDefault)
            .build();
    }
}
