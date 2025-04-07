import { User } from '@core/domain/entities/user.entity';
import { Id } from '@core/types/common.type';
import { Body, Controller, Delete, Get, Inject, Param, Post, Put, Query } from '@nestjs/common';
import { ICommandHandler, IQueryHandler } from '@shared/types/cqrs.type';
import { PaginatedResponse } from '@shared/types/pagination.type';
import {
    UserCreateCommand,
    UserCreateDto,
    UserDeleteCommand,
    UserDetailQuery,
    UserListQuery,
    UserQueryDto,
    UserUpdateCommand,
    UserUpdateDto,
} from '../application/user.dto';
import { USER_TOKENS } from '../application/user.token';

@Controller('users')
export class UserController {
    constructor(
        /* Commands */
        @Inject(USER_TOKENS.HANDLERS.COMMAND.CREATE)
        private readonly userCreateCommandHandler: ICommandHandler<UserCreateCommand, Id>,

        @Inject(USER_TOKENS.HANDLERS.COMMAND.UPDATE)
        private readonly userUpdateCommandHandler: ICommandHandler<UserUpdateCommand, boolean>,

        @Inject(USER_TOKENS.HANDLERS.COMMAND.DELETE)
        private readonly userDeleteCommandHandler: ICommandHandler<UserDeleteCommand, boolean>,

        /* Queries */
        @Inject(USER_TOKENS.HANDLERS.QUERY.LIST)
        private readonly userQueryHandler: IQueryHandler<UserListQuery, PaginatedResponse<User>>,

        @Inject(USER_TOKENS.HANDLERS.QUERY.DETAIL)
        private readonly userDetailQueryHandler: IQueryHandler<UserDetailQuery, User>,
    ) {}

    @Post()
    async add(@Body() body: UserCreateDto) {
        return this.userCreateCommandHandler.execute({ dto: body, createdById: null });
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() body: UserUpdateDto) {
        return this.userUpdateCommandHandler.execute({ id, dto: body, updatedById: null });
    }

    @Delete(':id')
    async remove(@Param('id') id: string) {
        return this.userDeleteCommandHandler.execute({ id, deletedById: null });
    }

    @Get()
    async list(@Query() query: UserQueryDto) {
        return this.userQueryHandler.execute({ dto: query });
    }

    @Get(':id')
    async findById(@Param('id') id: string) {
        return this.userDetailQueryHandler.execute({ id });
    }
}
