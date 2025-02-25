import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
    @Get('/site-health')
    siteHealth(): string {
        return 'OK';
    }

    @Get('/random-number')
    randomNumber(): string {
        return Math.random().toString();
    }
}
