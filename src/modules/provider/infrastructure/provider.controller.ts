import { Controller, Get, Inject, Query } from '@nestjs/common';
import { IProviderService } from '../application/provider-service.in';
import { ProviderPriceQuery, ProviderQuery } from '../application/provider.dto';
import { PROVIDER_SERVICE_TOKEN } from '../application/provider.token';

@Controller('provider')
export class ProviderController {
    constructor(@Inject(PROVIDER_SERVICE_TOKEN) private readonly service: IProviderService) {}

    @Get('ping')
    async ping(): Promise<any> {
        return this.service.ping();
    }

    @Get('search')
    async search(@Query() query: ProviderQuery) {
        return this.service.search(query);
    }

    @Get('price')
    async price(@Query() query: ProviderPriceQuery) {
        return this.service.getPrice(query);
    }
}
