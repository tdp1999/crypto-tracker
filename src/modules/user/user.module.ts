import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateUserCommand } from './application/commands/create-user.command';
import { DeleteUserCommand } from './application/commands/delete-user.command';
import { UpdateUserCommand } from './application/commands/update-user.command';
import { DetailUserQuery } from './application/queries/detail-user.query';
import { ListUserQuery } from './application/queries/list-user.query';
import { USER_TOKENS } from './application/user.token';
import { UserConfigAdapter } from './infrastructure/adapters/user-config.adapter';
import { UserController } from './infrastructure/user.controller';
import { UserEntity } from './infrastructure/user.persistence';
import { UserRepository } from './infrastructure/user.repository';
@Module({
    controllers: [UserController],
    imports: [TypeOrmModule.forFeature([UserEntity])],
    providers: [
        {
            provide: USER_TOKENS.ADAPTERS.CONFIG,
            useClass: UserConfigAdapter,
        },
        {
            provide: USER_TOKENS.REPOSITORIES,
            useClass: UserRepository,
        },
        {
            provide: USER_TOKENS.HANDLERS.COMMAND.CREATE,
            useClass: CreateUserCommand,
        },
        {
            provide: USER_TOKENS.HANDLERS.COMMAND.UPDATE,
            useClass: UpdateUserCommand,
        },
        {
            provide: USER_TOKENS.HANDLERS.COMMAND.DELETE,
            useClass: DeleteUserCommand,
        },
        {
            provide: USER_TOKENS.HANDLERS.QUERY.LIST,
            useClass: ListUserQuery,
        },
        {
            provide: USER_TOKENS.HANDLERS.QUERY.DETAIL,
            useClass: DetailUserQuery,
        },
    ],
})
export class UserModule {}
