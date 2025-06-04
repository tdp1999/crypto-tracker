import { Requester } from '@core/decorators/requester.decorator';
import { IUser } from '@core/features/user/user.entity';
import { Id } from '@core/types/common.type';
import { Body, Controller, Post } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { AddTokenCommand } from '../../application/commands/add-token.command';

@Controller('asset')
export class AssetController {
    constructor(
        private readonly commandBus: CommandBus,
        private readonly queryBus: QueryBus,
    ) {}

    @Post()
    async add(@Body() body: unknown, @Requester() user: IUser): Promise<Id> {
        return await this.commandBus.execute<AddTokenCommand, Id>(new AddTokenCommand({ dto: body, userId: user.id }));
    }

    // @Put(':id')
    // async update(@Param('id') id: string, @Body() body: unknown, @Requester() user: IUser): Promise<boolean> {
    //     return await this.commandBus.execute<UpdateTokenCommand, boolean>(
    //         new UpdateTokenCommand({ id, dto: body, updatedById: user.id }),
    //     );
    // }

    // @Delete(':id')
    // async delete(@Param('id') id: string, @Requester() user: IUser): Promise<boolean> {
    //     return await this.commandBus.execute<DeleteTokenCommand, boolean>(
    //         new DeleteTokenCommand({ id, userId: user.id }),
    //     );
    // }

    // @Get()
    // async list(@Query() query: AssetQueryDto, @Requester() user: IUser): Promise<PaginatedResponse<Asset>> {
    //     return await this.queryBus.execute<AssetListQuery, PaginatedResponse<Asset>>(
    //         new AssetListQuery({ dto: { ...query, userId: user.id }, userId: user.id }),
    //     );
    // }

    // @Get(':id')
    // async findById(@Param('id') id: string, @Requester() user: IUser): Promise<Asset> {
    //     return await this.queryBus.execute<AssetDetailQuery, Asset>(
    //         new AssetDetailQuery({ id, userId: user.id }),
    //     );
    // }
}
