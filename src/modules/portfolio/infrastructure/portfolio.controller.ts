import { Requester } from '@core/decorators/requester.decorator';
import { IUser } from '@core/features/user/user.entity';
import { Id } from '@core/types/common.type';
import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { PaginatedResponse } from '@shared/types/pagination.type';
import { CreatePortfolioCommand } from '../application/commands/create-portfolio.command';
import { DeletePortfolioCommand } from '../application/commands/delete-portfolio.command';
import { UpdatePortfolioCommand } from '../application/commands/update-portfolio.command';
import { PortfolioQueryDto } from '../application/portfolio.dto';
import { PortfolioDetailQuery } from '../application/queries/detail-portfolio.query';
import { PortfolioListQuery } from '../application/queries/list-portfolio.query';
import { Portfolio } from '../domain/entities/portfolio.entity';

@Controller('portfolio')
export class PortfolioController {
    constructor(
        private readonly commandBus: CommandBus,
        private readonly queryBus: QueryBus,
    ) {}

    @Post()
    async create(@Body() body: unknown, @Requester() user: IUser): Promise<Id> {
        return await this.commandBus.execute<CreatePortfolioCommand, Id>(
            new CreatePortfolioCommand({ dto: body, userId: user.id }),
        );
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() body: unknown, @Requester() user: IUser): Promise<boolean> {
        return await this.commandBus.execute<UpdatePortfolioCommand, boolean>(
            new UpdatePortfolioCommand({ id, dto: body, userId: user.id }),
        );
    }

    @Delete(':id')
    async remove(@Param('id') id: string, @Requester() user: IUser): Promise<boolean> {
        return await this.commandBus.execute<DeletePortfolioCommand, boolean>(
            new DeletePortfolioCommand({ dto: { id }, userId: user.id }),
        );
    }

    @Get()
    async list(@Query() query: PortfolioQueryDto, @Requester() user: IUser): Promise<PaginatedResponse<Portfolio>> {
        return await this.queryBus.execute<PortfolioListQuery, PaginatedResponse<Portfolio>>(
            new PortfolioListQuery({ dto: { ...query, userId: user.id }, userId: user.id }),
        );
    }

    @Get(':id')
    async findById(@Param('id') id: string, @Requester() user: IUser): Promise<Portfolio> {
        return await this.queryBus.execute<PortfolioDetailQuery, Portfolio>(
            new PortfolioDetailQuery({ id, userId: user.id }),
        );
    }
}
