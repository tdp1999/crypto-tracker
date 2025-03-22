import { Inject, Injectable } from '@nestjs/common';
import { IProviderService } from './provider-service.in';
import { PROVIDER_ADAPTER_TOKEN } from './provider.token';
import { ProviderQuery } from './provider.dto';
import { IProviderAsset } from '../domain/provider-asset.entity';

@Injectable()
export class ProviderService implements IProviderService {
    constructor(@Inject(PROVIDER_ADAPTER_TOKEN) private readonly adapter: IProviderService) {}

    async ping(): Promise<any> {
        return this.adapter.ping();
    }

    async search(query: ProviderQuery): Promise<IProviderAsset[]> {
        return this.adapter.search(query);
    }
}
