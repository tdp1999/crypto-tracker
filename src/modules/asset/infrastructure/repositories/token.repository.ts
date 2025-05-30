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
import { ITokenRepository } from '../../application/ports/token-repository.out.port';
import { SearchTokensDto } from '../../application/asset.dto';
import { IToken, Token } from '../../domain/token.entity';
import { TokenEntity } from '../persistence/token.persistence';

@Injectable()
export class TokenRepository implements ITokenRepository {
    constructor(
        @InjectRepository(TokenEntity)
        private readonly tokenRepository: Repository<TokenEntity>,
    ) {}

    // --- Public methods (IRepository implementation) ---
    async add(entity: Token): Promise<Id> {
        const persistenceInstance = this.tokenRepository.create(entity);
        const savedEntity = await this.tokenRepository.save(persistenceInstance);
        return savedEntity.id;
    }

    async update(id: Id, entity: Token): Promise<boolean> {
        try {
            const entityWithId = { ...entity, id };
            const persistenceInstance = this.tokenRepository.create(entityWithId);
            await this.tokenRepository.save(persistenceInstance);
            return true;
        } catch (error) {
            console.error('Token update failed:', error);
            return false;
        }
    }

    async remove(id: Id): Promise<boolean> {
        const result = await this.tokenRepository.delete(id);
        return result.affected !== undefined && result.affected !== null && result.affected > 0;
    }

    async list(query?: SearchTokensDto): Promise<Token[]> {
        const alias = 'token';
        let qb = this.tokenRepository.createQueryBuilder(alias);

        if (query) {
            qb = this._buildWhereClause(qb, query, alias);
            qb = withDefaultOrder(qb, alias, query);
            qb = applySelectClause(qb, alias, query.visibleColumns);
        }

        const entities = await qb.getMany();
        return this._toDomainArray(entities);
    }

    async paginatedList(query?: SearchTokensDto): Promise<PaginatedResponse<Token>> {
        const page = query?.page ?? DEFAULT_PAGE;
        const limit = query?.limit ?? DEFAULT_LIMIT;
        const offset = (page - 1) * limit;

        const alias = 'token';
        let qb = this.tokenRepository.createQueryBuilder(alias);

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

    async findById(id: Id): Promise<Token | null> {
        const entity = await this.tokenRepository.findOneBy({ id });
        return entity ? this._toDomain(entity) : null;
    }

    async findByIds(ids: Id[]): Promise<FindByIdsResult<Token, Id>> {
        const entities = await this.tokenRepository.findBy({ id: In(ids) });
        const found = this._toDomainArray(entities);
        const foundIds = new Set(found.map((t) => t.id));
        const notFound = ids.filter((id) => !foundIds.has(id));
        return { found, notFound };
    }

    async findOne(conditions: Partial<IToken>): Promise<Token | null> {
        const findConditions: FindOptionsWhere<TokenEntity> = conditions as FindOptionsWhere<TokenEntity>;
        const entity = await this.tokenRepository.findOneBy(findConditions);
        return entity ? this._toDomain(entity) : null;
    }

    async exists(id: Id): Promise<boolean> {
        const count = await this.tokenRepository.countBy({ id });
        return count > 0;
    }

    // --- Custom methods (ITokenRepository specific) ---
    async findBySymbol(symbol: string): Promise<Token | null> {
        const entity = await this.tokenRepository.findOne({
            where: {
                symbol: symbol.toUpperCase(),
                deletedAt: null as any,
            },
        });
        return entity ? this._toDomain(entity) : null;
    }

    async findByRefId(refId: string): Promise<Token | null> {
        const entity = await this.tokenRepository.findOne({
            where: {
                refId,
                deletedAt: null as any,
            },
        });
        return entity ? this._toDomain(entity) : null;
    }

    async findActiveTokens(): Promise<Token[]> {
        const entities = await this.tokenRepository.find({
            where: {
                isActive: true,
                deletedAt: null as any,
            },
        });
        return this._toDomainArray(entities);
    }

    async searchByName(query: string, limit = 10): Promise<Token[]> {
        const entities = await this.tokenRepository
            .createQueryBuilder('token')
            .where('token.deletedAt IS NULL')
            .andWhere('token.isActive = true')
            .andWhere('(LOWER(token.name) LIKE LOWER(:query) OR LOWER(token.symbol) LIKE LOWER(:query))', {
                query: `%${query}%`,
            })
            .orderBy('token.symbol', 'ASC')
            .limit(limit)
            .getMany();

        return this._toDomainArray(entities);
    }

    // --- Private helper methods ---
    private _toDomain(entity: TokenEntity): Token {
        // Simplified mapping - consider proper mapping if Token has complex logic
        return entity as unknown as Token;
    }

    private _toDomainArray(entities: TokenEntity[]): Token[] {
        return entities.map((entity) => this._toDomain(entity));
    }

    private _buildWhereClause(
        qb: SelectQueryBuilder<TokenEntity>,
        query: SearchTokensDto,
        alias: string = 'token',
    ): SelectQueryBuilder<TokenEntity> {
        return WhereBuilder.create(qb, alias)
            .like('name', query.name)
            .like('symbol', query.symbol)
            .equal('refId', query.refId)
            .build();
    }
}
