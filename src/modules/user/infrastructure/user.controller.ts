import { Requester } from '@core/decorators/requester.decorator';
import { IUser, User } from '@core/features/user/user.entity';
import { Id } from '@core/types/common.type';
import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { PaginatedResponse } from '@shared/types/pagination.type';
import { UserCreateDto, UserQueryDto, UserUpdateDto } from '../application/user.dto';
import { CreateUserCommand } from '../application/commands/create-user.command';
import { DeleteUserCommand } from '../application/commands/delete-user.command';
import { UpdateUserCommand } from '../application/commands/update-user.command';
import { UserDetailQuery } from '../application/queries/detail-user.query';
import { UserListQuery } from '../application/queries/list-user.query';

@Controller('users')
export class UserController {
    constructor(
        private readonly commandBus: CommandBus,
        private readonly queryBus: QueryBus,
    ) {}

    @Post()
    async add(@Body() body: UserCreateDto, @Requester() user: IUser): Promise<Id> {
        return await this.commandBus.execute<CreateUserCommand, Id>(
            new CreateUserCommand({ dto: body, createdById: user.id }),
        );
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() body: UserUpdateDto, @Requester() user: IUser): Promise<boolean> {
        return await this.commandBus.execute<UpdateUserCommand, boolean>(
            new UpdateUserCommand({ id, dto: body, updatedById: user.id }),
        );
    }

    @Delete(':id')
    async remove(@Param('id') id: string, @Requester() user: IUser): Promise<boolean> {
        return await this.commandBus.execute<DeleteUserCommand, boolean>(
            new DeleteUserCommand({ id, deletedById: user.id }),
        );
    }

    @Get()
    async list(@Query() query: UserQueryDto): Promise<PaginatedResponse<User>> {
        return await this.queryBus.execute<UserListQuery, PaginatedResponse<User>>(new UserListQuery({ dto: query }));
    }

    @Get(':id')
    async findById(@Param('id') id: string): Promise<User> {
        return await this.queryBus.execute<UserDetailQuery, User>(new UserDetailQuery({ id }));
    }
}
