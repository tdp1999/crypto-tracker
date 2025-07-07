// FLAG: PENDING VERIFICATION
import { Requester } from '@core/decorators/requester.decorator';
import { IUser } from '@core/features/user/user.entity';
import { Id } from '@core/types/common.type';
import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { PaginatedResponse } from '@shared/types/pagination.type';
import { CreateTransactionCommand } from '../../application/commands/create-transaction.command';
import { DeleteTransactionCommand } from '../../application/commands/delete-transaction.command';
import { UpdateTransactionCommand } from '../../application/commands/update-transaction.command';
import { ListTransactionsQuery } from '../../application/queries/list-transactions.query';
import { TransactionQueryDto } from '../../application/transaction.dto';
import { Transaction } from '../../domain/entities/transaction.entity';

@Controller('transaction')
export class TransactionController {
    constructor(
        private readonly commandBus: CommandBus,
        private readonly queryBus: QueryBus,
    ) {}

    @Post(':portfolioId')
    async create(
        @Param('portfolioId') portfolioId: string,
        @Body() body: unknown,
        @Requester() user: IUser,
    ): Promise<Id> {
        return await this.commandBus.execute<CreateTransactionCommand, Id>(
            new CreateTransactionCommand({
                dto: body,
                portfolioId,
                createdById: user.id,
            }),
        );
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() body: unknown, @Requester() user: IUser): Promise<void> {
        return await this.commandBus.execute<UpdateTransactionCommand, void>(
            new UpdateTransactionCommand({
                transactionId: id,
                dto: body,
                updatedById: user.id,
            }),
        );
    }

    @Delete(':id')
    async remove(@Param('id') id: string, @Requester() user: IUser): Promise<void> {
        return await this.commandBus.execute<DeleteTransactionCommand, void>(
            new DeleteTransactionCommand({
                transactionId: id,
                deletedById: user.id,
            }),
        );
    }

    @Get()
    async list(@Query() query: TransactionQueryDto, @Requester() user: IUser): Promise<PaginatedResponse<Transaction>> {
        return await this.queryBus.execute<ListTransactionsQuery, PaginatedResponse<Transaction>>(
            new ListTransactionsQuery({
                dto: query,
                userId: user.id,
            }),
        );
    }
}
