import { Requester } from '@core/decorators/requester.decorator';
import { IUser } from '@core/features/user/user.entity';
import { Id } from '@core/types/common.type';
import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ActivateFinancialGoalCommand } from '../../application/commands/activate-goal.command';
import { CreateFinancialGoalCommand } from '../../application/commands/create-goal.command';
import { UpdateFinancialGoalCommand } from '../../application/commands/update-goal.command';
import { FinancialGoalQueryDto } from '../../application/financial-goal.dto';
import { ListFinancialGoalsQuery } from '../../application/queries/list-goals.query';
import { FinancialGoal } from '../../domain/entities/financial-goal.entity';

@Controller('financial-goals')
export class FinancialGoalController {
    constructor(
        private readonly commandBus: CommandBus,
        private readonly queryBus: QueryBus,
    ) {}

    @Post()
    async create(@Body() body: unknown, @Requester() user: IUser): Promise<Id> {
        return await this.commandBus.execute<CreateFinancialGoalCommand, Id>(
            new CreateFinancialGoalCommand({ dto: body, userId: user.id }),
        );
    }

    @Patch(':id')
    async update(@Param('id') id: string, @Body() body: unknown, @Requester() user: IUser): Promise<boolean> {
        return await this.commandBus.execute<UpdateFinancialGoalCommand, boolean>(
            new UpdateFinancialGoalCommand({ id, dto: body, userId: user.id }),
        );
    }

    @Get()
    async list(@Query() query: FinancialGoalQueryDto, @Requester() user: IUser) {
        return await this.queryBus.execute<ListFinancialGoalsQuery, FinancialGoal[]>(
            new ListFinancialGoalsQuery({ dto: query, userId: user.id }),
        );
    }

    @Patch(':id/activate')
    async activate(@Param('id') id: string, @Requester() user: IUser): Promise<boolean> {
        return await this.commandBus.execute<ActivateFinancialGoalCommand, boolean>(
            new ActivateFinancialGoalCommand({ dto: { id }, userId: user.id }),
        );
    }
}
