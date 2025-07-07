// FLAG: PENDING VERIFICATION
import { BadRequestError } from '@core/errors/domain.error';
import { ErrorLayer } from '@core/errors/types/error-layer.type.error';
import { Id } from '@core/types/common.type';
import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Transaction, TransactionCreateSchema } from '../../domain/entities/transaction.entity';
import { PORTFOLIO_TOKENS } from '../portfolio.token';
import { ITransactionRepository } from '../ports/transaction-repository.out.port';

export class CreateTransactionCommand {
    constructor(public readonly payload: { dto: unknown; portfolioId: Id; createdById: Id }) {}
}

@Injectable()
@CommandHandler(CreateTransactionCommand)
export class CreateTransactionCommandHandler implements ICommandHandler<CreateTransactionCommand> {
    constructor(
        @Inject(PORTFOLIO_TOKENS.REPOSITORIES.TRANSACTION)
        private readonly transactionRepository: ITransactionRepository,
    ) {}

    async execute(command: CreateTransactionCommand): Promise<Id> {
        const { dto, portfolioId, createdById } = command.payload;
        const { success, data, error } = TransactionCreateSchema.safeParse(dto);

        if (!success) {
            throw BadRequestError(error, {
                layer: ErrorLayer.APPLICATION,
                remarks: 'Transaction creation failed',
            });
        }

        const transaction = Transaction.create(portfolioId, data, createdById);
        const transactionId = await this.transactionRepository.add(transaction);

        return transactionId;
    }
}
