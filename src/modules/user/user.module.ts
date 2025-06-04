import { ClientModule } from '@core/features/client/client.module';
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateUserCommandHandler } from './application/commands/create-user.command';
import { DeleteUserCommandHandler } from './application/commands/delete-user.command';
import { UpdateUserCommandHandler } from './application/commands/update-user.command';
import { CredentialValidityQueryHandler } from './application/queries/credential-validity.query';
import { DetailUserByConditionQueryHandler } from './application/queries/detail-user-by-condition.query';
import { DetailUserQueryHandler } from './application/queries/detail-user.query';
import { ListUserQueryHandler } from './application/queries/list-user.query';
import { UserValidityQueryHandler } from './application/queries/user-validity.query';
import { USER_TOKENS } from './application/user.token';
import { UserConfigAdapter } from './infrastructure/adapters/user-config.adapter';
import { UserController } from './infrastructure/user.controller';
import { UserPersistence } from './infrastructure/user.persistence';
import { UserRepository } from './infrastructure/user.repository';
import { UserRpcController } from './infrastructure/user.rpc';

const CommandHandlers = [CreateUserCommandHandler, UpdateUserCommandHandler, DeleteUserCommandHandler];

const QueryHandlers = [
    ListUserQueryHandler,
    DetailUserQueryHandler,
    DetailUserByConditionQueryHandler,
    CredentialValidityQueryHandler,
    UserValidityQueryHandler,
];

@Module({
    controllers: [UserController, UserRpcController],
    imports: [TypeOrmModule.forFeature([UserPersistence]), ClientModule.registerAsync(), CqrsModule],
    providers: [
        {
            provide: USER_TOKENS.ADAPTERS.CONFIG,
            useClass: UserConfigAdapter,
        },
        {
            provide: USER_TOKENS.REPOSITORIES,
            useClass: UserRepository,
        },

        ...CommandHandlers,
        ...QueryHandlers,
    ],
})
export class UserModule {}
