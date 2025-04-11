import { RequireNoAuth } from '@core/decorators/public.decorator';
import { Requester } from '@core/decorators/requester.decorator';
import { IUser } from '@core/features/user/user.entity';
import { Body, Controller, Get, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { AuthLoginDto, AuthRegisterDto } from '../application/auth.dto';
import { LoginCommand } from '../application/commands/login.command';
import { RegisterCommand } from '../application/commands/register.command';
import { IAuthLoginResponse } from '../application/ports/auth-login.in.port';

@Controller('auth')
export class AuthController {
    constructor(private readonly commandBus: CommandBus) {}

    @RequireNoAuth()
    @Post('register')
    async register(@Body() data: AuthRegisterDto) {
        return this.commandBus.execute<RegisterCommand, boolean>(new RegisterCommand({ dto: data }));
    }

    @RequireNoAuth()
    @Post('login')
    async login(@Body() credentials: AuthLoginDto) {
        return this.commandBus.execute<LoginCommand, IAuthLoginResponse>(new LoginCommand({ dto: credentials }));
    }

    // @Post('logout')
    // async logout() {
    //     return this.logoutHandler.execute();
    // }

    @Get('me')
    me(@Requester() user: IUser) {
        return user;
    }
}
