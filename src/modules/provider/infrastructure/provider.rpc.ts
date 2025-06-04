import { ProviderAction } from '@core/actions/provider.action';
import { RpcExceptionFilter } from '@core/filters/rpc-exception.filter';
import { Controller, Inject, UseFilters } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { IProviderService } from '../application/provider-service.in';
import { ProviderDetailsQuery, ProviderPriceQuery, ProviderQuery } from '../application/provider.dto';
import { PROVIDER_SERVICE_TOKEN } from '../application/provider.token';
import { IProviderAsset, IProviderDetails, IProviderPrice } from '../domain/provider-asset.entity';

@Controller()
@UseFilters(RpcExceptionFilter)
export class ProviderRpcController {
    constructor(@Inject(PROVIDER_SERVICE_TOKEN) private readonly service: IProviderService) {}

    @MessagePattern(ProviderAction.PING)
    async ping(): Promise<any> {
        return this.service.ping();
    }

    @MessagePattern(ProviderAction.SEARCH)
    async search(query: ProviderQuery): Promise<IProviderAsset[]> {
        return this.service.search(query);
    }

    @MessagePattern(ProviderAction.PRICE)
    async price(query: ProviderPriceQuery): Promise<IProviderPrice[]> {
        return this.service.getPrice(query);
    }

    @MessagePattern(ProviderAction.DETAILS)
    async details(query: ProviderDetailsQuery): Promise<IProviderDetails> {
        return this.service.getDetails(query);
    }
}
