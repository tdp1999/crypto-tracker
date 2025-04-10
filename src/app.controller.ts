import { Controller, Get } from '@nestjs/common';
import { Public } from '@core/decorators/public.decorator';
@Controller()
export class AppController {
    @Public()
    @Get('/site-health')
    siteHealth(): string {
        return 'OK';
    }

    @Get('/random-number')
    randomNumber(): string {
        return Math.random().toString();
    }
}
