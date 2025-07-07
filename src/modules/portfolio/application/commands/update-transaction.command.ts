// FLAG: PENDING VERIFICATION
import { BadRequestError, NotFoundError } from '@core/errors/domain.error';
import { ErrorLayer } from '@core/errors/types/error-layer.type.error';
import { Id } from '@core/types/common.type';
import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Transaction, TransactionUpdateSchema } from '../../domain/entities/transaction.entity';
import { PORTFOLIO_TOKENS } from '../portfolio.token';
import { ITransactionRepository } from '../ports/transaction-repository.out.port';

export class UpdateTransactionCommand {
    constructor(public readonly payload: { transactionId: Id; dto: unknown; updatedById: Id }) {}
}

@Injectable()
@CommandHandler(UpdateTransactionCommand)
export class UpdateTransactionCommandHandler implements ICommandHandler<UpdateTransactionCommand> {
    constructor(
        @Inject(PORTFOLIO_TOKENS.REPOSITORIES.TRANSACTION)
        private readonly transactionRepository: ITransactionRepository,
    ) {}

    async execute(command: UpdateTransactionCommand): Promise<void> {
        const { transactionId, dto, updatedById } = command.payload;
        const { success, data, error } = TransactionUpdateSchema.safeParse(dto);

        if (!success) {
            throw BadRequestError(error, {
                layer: ErrorLayer.APPLICATION,
                remarks: 'Transaction update failed',
            });
        }

        const existingTransaction = await this.transactionRepository.findById(transactionId);
        if (!existingTransaction) {
            throw NotFoundError('Transaction not found', {
                layer: ErrorLayer.APPLICATION,
                remarks: 'Transaction update failed',
            });
        }

        const updatedTransaction = Transaction.update(existingTransaction, data, updatedById);
        await this.transactionRepository.update(transactionId, updatedTransaction);
    }
}
