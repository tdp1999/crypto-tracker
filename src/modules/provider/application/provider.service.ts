import { BadRequestError } from '@core/errors/domain.error';
import { ErrorLayer } from '@core/errors/types/error-layer.type.error';
import { Inject, Injectable } from '@nestjs/common';
import { IProviderAsset, IProviderPrice } from '../domain/provider-asset.entity';
import { IProviderService } from './provider-service.in';
import { ProviderPriceQuery, ProviderPriceQuerySchema, ProviderQuery, ProviderQuerySchema } from './provider.dto';
import { PROVIDER_ADAPTER_TOKEN } from './provider.token';

@Injectable()
export class ProviderService implements IProviderService {
    constructor(@Inject(PROVIDER_ADAPTER_TOKEN) private readonly adapter: IProviderService) {}

    async ping(): Promise<any> {
        return this.adapter.ping();
    }

    async search(query: ProviderQuery): Promise<IProviderAsset[]> {
        const { success, error, data } = ProviderQuerySchema.safeParse(query);
        if (!success) throw BadRequestError(error, { layer: ErrorLayer.APPLICATION });
        return this.adapter.search(data);
    }

    async getPrice(query: ProviderPriceQuery): Promise<IProviderPrice[]> {
        const { success, error, data } = ProviderPriceQuerySchema.safeParse(query);
        if (!success) throw BadRequestError(error, { layer: ErrorLayer.APPLICATION });
        return this.adapter.getPrice(data);
    }
}
