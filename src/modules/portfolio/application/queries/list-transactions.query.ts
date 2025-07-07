// FLAG: PENDING VERIFICATION
import { BadRequestError } from '@core/errors/domain.error';
import { ErrorLayer } from '@core/errors/types/error-layer.type.error';
import { Id } from '@core/types/common.type';
import { Inject, Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PaginatedResponse } from '@shared/types/pagination.type';
import { Transaction } from '../../domain/entities/transaction.entity';
import { PORTFOLIO_TOKENS } from '../portfolio.token';
import { ITransactionRepository } from '../ports/transaction-repository.out.port';
import { TransactionQuerySchema } from '../transaction.dto';

export class ListTransactionsQuery {
    constructor(public readonly payload: { dto: unknown; userId: Id }) {}
}

@Injectable()
@QueryHandler(ListTransactionsQuery)
export class ListTransactionsQueryHandler
    implements IQueryHandler<ListTransactionsQuery, PaginatedResponse<Transaction>>
{
    constructor(
        @Inject(PORTFOLIO_TOKENS.REPOSITORIES.TRANSACTION)
        private readonly transactionRepository: ITransactionRepository,
    ) {}

    async execute(query: ListTransactionsQuery): Promise<PaginatedResponse<Transaction>> {
        const { dto } = query.payload;
        const { success, error, data } = TransactionQuerySchema.safeParse(dto);

        if (!success) {
            throw BadRequestError(error, { layer: ErrorLayer.APPLICATION });
        }

        // The DTO already supports filtering by portfolioId, tokenSymbol, type, timestamp, etc.
        // No additional filtering needed as the repository handles the query parameters
        return this.transactionRepository.paginatedList(data);
    }
}
