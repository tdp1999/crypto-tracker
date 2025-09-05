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
import { AssetQueryDto } from '../../application/asset.dto';
import { IAssetRepository } from '../../application/ports/asset-repository.out.port';
import { Asset } from '../../domain/entities/asset.entity';
import { AssetMapper } from '../mapper/asset.mapper';
import { AssetPersistence } from '../persistence/asset.persistence';

@Injectable()
export class AssetRepository implements IAssetRepository {
    private readonly alias = 'asset';

    constructor(
        @InjectRepository(AssetPersistence)
        private readonly repository: Repository<AssetPersistence>,
    ) {}

    async add(asset: Asset): Promise<Id> {
        const created = this.repository.create(AssetMapper.toPersistence(asset));
        const saved = await this.repository.save(created);
        return saved.id;
    }

    async update(id: Id, entity: Asset): Promise<boolean> {
        const persistence = AssetMapper.toPersistence(entity);
        const instance = this.repository.create({ ...persistence, id });
        await this.repository.save(instance);
        return true;
    }

    async remove(id: Id): Promise<boolean> {
        const result = await this.repository.softDelete({ id });
        return result.affected !== undefined && result.affected !== null && result.affected > 0;
    }

    async list(query?: AssetQueryDto): Promise<Asset[]> {
        let qb = this.repository.createQueryBuilder(this.alias);

        if (query) {
            qb = this._buildWhereClause(qb, query, this.alias);
            qb = withDefaultOrder(qb, this.alias, query);
            qb.leftJoinAndSelect(`${this.alias}.target`, 'target');
            qb = applySelectClause(qb, this.alias, query.visibleColumns);
        }

        const entities = await qb.getMany();
        return AssetMapper.toDomainArray(entities);
    }

    async paginatedList(query?: AssetQueryDto): Promise<PaginatedResponse<Asset>> {
        const page = query?.page ?? DEFAULT_PAGE;
        const limit = query?.limit ?? DEFAULT_LIMIT;
        const offset = (page - 1) * limit;

        let qb = this.repository.createQueryBuilder(this.alias);

        if (query) {
            qb = this._buildWhereClause(qb, query, this.alias);
            qb = withDefaultOrder(qb, this.alias, query);
            qb.leftJoinAndSelect(`${this.alias}.target`, 'target');
            qb = applySelectClause(qb, this.alias, query.visibleColumns);
        }

        qb.skip(offset).take(limit);

        const [entities, total] = await qb.getManyAndCount();
        const items = AssetMapper.toDomainArray(entities);
        return paginate(items, total, page, limit);
    }

    async findById(id: Id): Promise<Asset | null> {
        const entity = await this.repository.findOneBy({ id });
        return entity ? AssetMapper.toDomain(entity) : null;
    }

    async findByIds(ids: Id[]): Promise<FindByIdsResult<Asset, Id>> {
        const entities = await this.repository.findBy({ id: In(ids) });
        const found = AssetMapper.toDomainArray(entities);
        const foundIds = new Set(found.map((a) => a.props.id));
        const notFound = ids.filter((id) => !foundIds.has(id));
        return { found, notFound };
    }

    async findOne(conditions: Partial<Asset>): Promise<Asset | null> {
        const findConditions: FindOptionsWhere<AssetPersistence> = conditions as FindOptionsWhere<AssetPersistence>;
        const entity = await this.repository.findOneBy(findConditions);
        return entity ? AssetMapper.toDomain(entity) : null;
    }

    async exists(id: Id): Promise<boolean> {
        const count = await this.repository.countBy({ id });
        return count > 0;
    }

    async getById(id: Id, userId: Id): Promise<Asset> {
        const found = await this.repository.findOne({ where: { id, userId } });
        if (!found) throw new Error('Asset not found');
        return AssetMapper.toDomain(found);
    }

    async findByUserId(userId: Id, query: AssetQueryDto): Promise<Asset[]> {
        let qb = this.repository
            .createQueryBuilder(this.alias)
            .leftJoinAndSelect(`${this.alias}.target`, 'target')
            .where(`${this.alias}.user_id = :userId`, { userId });

        qb = this._buildWhereClause(qb, query, this.alias);
        qb = withDefaultOrder(qb, this.alias, query);

        const entities = await qb.getMany();
        return AssetMapper.toDomainArray(entities);
    }

    private _buildWhereClause(
        qb: SelectQueryBuilder<AssetPersistence>,
        query: AssetQueryDto,
        alias: string = 'asset',
    ): SelectQueryBuilder<AssetPersistence> {
        return WhereBuilder.create(qb, alias)
            .like('name', query.name)
            .equal('userId', query.userId)
            .equal('type', query.type)
            .build();
    }
}
