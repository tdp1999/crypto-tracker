// FLAG: PENDING VERIFICATION
import { NotFoundError } from '@core/errors/domain.error';
import { ErrorLayer } from '@core/errors/types/error-layer.type.error';
import { Id } from '@core/types/common.type';
import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Transaction } from '../../domain/entities/transaction.entity';
import { PORTFOLIO_TOKENS } from '../portfolio.token';
import { ITransactionRepository } from '../ports/transaction-repository.out.port';

export class DeleteTransactionCommand {
    constructor(public readonly payload: { transactionId: Id; deletedById: Id }) {}
}

@Injectable()
@CommandHandler(DeleteTransactionCommand)
export class DeleteTransactionCommandHandler implements ICommandHandler<DeleteTransactionCommand> {
    constructor(
        @Inject(PORTFOLIO_TOKENS.REPOSITORIES.TRANSACTION)
        private readonly transactionRepository: ITransactionRepository,
    ) {}

    async execute(command: DeleteTransactionCommand): Promise<void> {
        const { transactionId, deletedById } = command.payload;

        const existingTransaction = await this.transactionRepository.findById(transactionId);
        if (!existingTransaction) {
            throw NotFoundError('Transaction not found', {
                layer: ErrorLayer.APPLICATION,
                remarks: 'Transaction deletion failed',
            });
        }

        const deletedTransaction = Transaction.markDeleted(existingTransaction, deletedById);
        await this.transactionRepository.update(transactionId, deletedTransaction);
    }
}
