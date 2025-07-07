// FLAG: PENDING VERIFICATION
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
import { TransactionQueryDto } from '../../application/transaction.dto';
import { ITransactionRepository } from '../../application/ports/transaction-repository.out.port';
import { ITransaction, Transaction } from '../../domain/entities/transaction.entity';
import { TransactionPersistence } from '../persistence/transaction.persistence';

@Injectable()
export class TransactionRepository implements ITransactionRepository {
    constructor(
        @InjectRepository(TransactionPersistence)
        private readonly transactionRepository: Repository<TransactionPersistence>,
    ) {}

    // --- Public methods (IRepository implementation) ---
    async add(entity: Transaction): Promise<Id> {
        const persistenceInstance = this.transactionRepository.create(entity);
        const savedEntity = await this.transactionRepository.save(persistenceInstance);
        return savedEntity.id;
    }

    async update(id: Id, entity: Transaction): Promise<boolean> {
        try {
            const entityWithId = { ...entity, id };
            const persistenceInstance = this.transactionRepository.create(entityWithId);
            await this.transactionRepository.save(persistenceInstance);
            return true;
        } catch (error) {
            console.error('Transaction update failed:', error);
            return false;
        }
    }

    async remove(id: Id): Promise<boolean> {
        const result = await this.transactionRepository.delete(id);
        return result.affected !== undefined && result.affected !== null && result.affected > 0;
    }

    async list(query?: TransactionQueryDto): Promise<Transaction[]> {
        const alias = 'transaction';
        let qb = this.transactionRepository.createQueryBuilder(alias);

        if (query) {
            qb = this._buildWhereClause(qb, query, alias);
            qb = withDefaultOrder(qb, alias, query);
            qb = applySelectClause(qb, alias, query.visibleColumns);
        }

        const entities = await qb.getMany();
        return this._toDomainArray(entities);
    }

    async paginatedList(query?: TransactionQueryDto): Promise<PaginatedResponse<Transaction>> {
        const page = query?.page ?? DEFAULT_PAGE;
        const limit = query?.limit ?? DEFAULT_LIMIT;
        const offset = (page - 1) * limit;

        const alias = 'transaction';
        let qb = this.transactionRepository.createQueryBuilder(alias);

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

    async findById(id: Id): Promise<Transaction | null> {
        const entity = await this.transactionRepository.findOneBy({ id });
        return entity ? this._toDomain(entity) : null;
    }

    async findByIds(ids: Id[]): Promise<FindByIdsResult<Transaction, Id>> {
        const entities = await this.transactionRepository.findBy({ id: In(ids) });
        const found = this._toDomainArray(entities);
        const foundIds = new Set(found.map((t) => t.id));
        const notFound = ids.filter((id) => !foundIds.has(id));
        return { found, notFound };
    }

    async findOne(conditions: Partial<ITransaction>): Promise<Transaction | null> {
        const findConditions: FindOptionsWhere<TransactionPersistence> =
            conditions as FindOptionsWhere<TransactionPersistence>;
        const entity = await this.transactionRepository.findOneBy(findConditions);
        return entity ? this._toDomain(entity) : null;
    }

    async exists(id: Id): Promise<boolean> {
        const count = await this.transactionRepository.countBy({ id });
        return count > 0;
    }

    // --- Custom methods (ITransactionRepository specific) ---
    async findByPortfolioId(portfolioId: Id): Promise<Transaction[]> {
        const entities = await this.transactionRepository.findBy({
            portfolioId,
            deletedAt: IsNull(),
        });
        return this._toDomainArray(entities);
    }

    async findByPortfolioIdAndTokenSymbol(portfolioId: Id, tokenSymbol: string): Promise<Transaction[]> {
        const entities = await this.transactionRepository.findBy({
            portfolioId,
            tokenSymbol,
            deletedAt: IsNull(),
        });
        return this._toDomainArray(entities);
    }

    async findByTokenSymbol(tokenSymbol: string, userId: Id): Promise<Transaction[]> {
        const entities = await this.transactionRepository
            .createQueryBuilder('transaction')
            .innerJoin('transaction.portfolio', 'portfolio')
            .where('transaction.tokenSymbol = :tokenSymbol', { tokenSymbol })
            .andWhere('portfolio.userId = :userId', { userId })
            .andWhere('transaction.deletedAt IS NULL')
            .getMany();

        return this._toDomainArray(entities);
    }

    async countByPortfolioId(portfolioId: Id): Promise<number> {
        return await this.transactionRepository.countBy({
            portfolioId,
            deletedAt: IsNull(),
        });
    }

    async findByExternalId(externalId: string): Promise<Transaction[]> {
        const entities = await this.transactionRepository.findBy({
            externalId,
            deletedAt: IsNull(),
        });
        return this._toDomainArray(entities);
    }

    async findByPortfolioIdAndDateRange(portfolioId: Id, startDate: string, endDate: string): Promise<Transaction[]> {
        const entities = await this.transactionRepository
            .createQueryBuilder('transaction')
            .where('transaction.portfolioId = :portfolioId', { portfolioId })
            .andWhere('transaction.timestamp >= :startDate', { startDate })
            .andWhere('transaction.timestamp <= :endDate', { endDate })
            .andWhere('transaction.deletedAt IS NULL')
            .orderBy('transaction.timestamp', 'DESC')
            .getMany();

        return this._toDomainArray(entities);
    }

    async softDelete(transactionId: Id, deletedById: Id): Promise<void> {
        await this.transactionRepository.update(transactionId, {
            deletedAt: new Date().toISOString(),
            deletedById,
        });
    }

    // --- Private helper methods ---
    private _toDomain(entity: TransactionPersistence): Transaction {
        return Transaction.fromPersistence(entity);
    }

    private _toDomainArray(entities: TransactionPersistence[]): Transaction[] {
        return entities.map((entity) => this._toDomain(entity));
    }

    private _buildWhereClause(
        qb: SelectQueryBuilder<TransactionPersistence>,
        query: TransactionQueryDto,
        alias: string = 'transaction',
    ): SelectQueryBuilder<TransactionPersistence> {
        const builder = WhereBuilder.create(qb, alias)
            .equal('portfolioId', query.portfolioId)
            .equal('refId', query.refId)
            .equal('tokenSymbol', query.tokenSymbol)
            .equal('type', query.type)
            .equal('externalId', query.externalId);

        // Handle timestamp filtering manually if needed
        if (query.timestamp) {
            builder.equal('timestamp', query.timestamp);
        }

        return builder.build();
    }
}
