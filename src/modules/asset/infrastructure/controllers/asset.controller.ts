import { Requester } from '@core/decorators/requester.decorator';
import { IUser } from '@core/features/user/user.entity';
import { Id } from '@core/types/common.type';
import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateAssetCommand } from '../../application/commands/create-asset.command';
import { DeleteAssetCommand } from '../../application/commands/delete-asset.command';
import { UpdateAssetCommand } from '../../application/commands/update-asset.command';
import { AssetDashboardDto, AssetQueryDto } from '../../application/asset.dto';
import { ListAssetsQuery } from '../../application/queries/list-assets.query';

@Controller('assets')
export class AssetController {
    constructor(
        private readonly commandBus: CommandBus,
        private readonly queryBus: QueryBus,
    ) {}

    @Post()
    async create(@Body() body: unknown, @Requester() user: IUser): Promise<Id> {
        return await this.commandBus.execute<CreateAssetCommand, Id>(
            new CreateAssetCommand({ dto: body, userId: user.id }),
        );
    }

    @Patch(':id')
    async update(@Param('id') id: string, @Body() body: unknown, @Requester() user: IUser): Promise<boolean> {
        return await this.commandBus.execute<UpdateAssetCommand, boolean>(
            new UpdateAssetCommand({ id, dto: body, userId: user.id }),
        );
    }

    @Delete(':id')
    async remove(@Param('id') id: string, @Requester() user: IUser): Promise<boolean> {
        return await this.commandBus.execute<DeleteAssetCommand, boolean>(
            new DeleteAssetCommand({ dto: { id }, userId: user.id }),
        );
    }

    @Get()
    async list(@Query() query: AssetQueryDto, @Requester() user: IUser): Promise<AssetDashboardDto> {
        return await this.queryBus.execute<ListAssetsQuery, AssetDashboardDto>(
            new ListAssetsQuery({ dto: query, userId: user.id }),
        );
    }
}
