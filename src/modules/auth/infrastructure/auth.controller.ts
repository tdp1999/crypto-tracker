import { RequireNoAuth } from '@core/decorators/public.decorator';
import { Requester } from '@core/decorators/requester.decorator';
import { IUser, User } from '@core/features/user/user.entity';
import { Body, Controller, Get, Inject, Post } from '@nestjs/common';
import { ICommandHandler } from '@shared/types/cqrs.type';
import { AuthLoginDto, AuthRegisterDto } from '../application/auth.dto';
import { AUTH_TOKEN } from '../application/auth.token';

@Controller('auth')
export class AuthController {
    constructor(
        @Inject(AUTH_TOKEN.HANDLERS.COMMAND.REGISTER)
        private readonly registerHandler: ICommandHandler<AuthRegisterDto, User>,

        @Inject(AUTH_TOKEN.HANDLERS.COMMAND.LOGIN)
        private readonly loginHandler: ICommandHandler<AuthLoginDto, User>,

        @Inject(AUTH_TOKEN.HANDLERS.COMMAND.LOGOUT)
        private readonly logoutHandler: ICommandHandler<void, void>,
    ) {}

    @RequireNoAuth()
    @Post('register')
    async register(@Body() data: AuthRegisterDto) {
        return this.registerHandler.execute(data);
    }

    @RequireNoAuth()
    @Post('login')
    async login(@Body() credentials: AuthLoginDto) {
        return this.loginHandler.execute(credentials);
    }

    @Post('logout')
    async logout() {
        return this.logoutHandler.execute();
    }

    @Get('me')
    me(@Requester() user: IUser) {
        return user;
    }
}
