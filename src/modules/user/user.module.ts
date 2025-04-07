import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateUserCommand } from './application/commands/create-user.command';
import { USER_TOKENS } from './application/user.token';
import { UserController } from './infrastructure/user.controller';
import { UserEntity } from './infrastructure/user.persistence';
import { UserRepository } from './infrastructure/user.repository';

@Module({
    controllers: [UserController],
    imports: [TypeOrmModule.forFeature([UserEntity])],
    providers: [
        {
            provide: USER_TOKENS.REPOSITORIES,
            useClass: UserRepository,
        },
        {
            provide: USER_TOKENS.HANDLERS.COMMAND.CREATE,
            useClass: CreateUserCommand,
        },
    ],
})
export class UserModule {}
