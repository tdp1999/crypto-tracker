import { BadRequestError } from '@core/errors/domain.error';
import { formatZodError } from '@core/errors/formatter.error';
import { Inject, Injectable } from '@nestjs/common';
import { IProviderAsset, IProviderPrice } from '../domain/provider-asset.entity';
import { IProviderService } from './provider-service.in';
import { ProviderPriceQuery, ProviderQuery, ProviderQuerySchema } from './provider.dto';
import { PROVIDER_ADAPTER_TOKEN } from './provider.token';

@Injectable()
export class ProviderService implements IProviderService {
    constructor(@Inject(PROVIDER_ADAPTER_TOKEN) private readonly adapter: IProviderService) {}

    async ping(): Promise<any> {
        return this.adapter.ping();
    }

    async search(query: ProviderQuery): Promise<IProviderAsset[]> {
        const { success, error, data } = ProviderQuerySchema.safeParse(query);
        if (!success) throw BadRequestError(formatZodError(error), { layer: 'application' });
        return this.adapter.search(data);
    }

    async getPrice(query: ProviderPriceQuery): Promise<IProviderPrice[]> {
        return this.adapter.getPrice(query);
    }
}
