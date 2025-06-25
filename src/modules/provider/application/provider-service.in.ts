import { IProviderAsset, IProviderDetails, IProviderPrice } from '@core/features/provider/provider-asset.entity';
import { ProviderDetailsQuery, ProviderPriceQuery, ProviderQuery } from './provider.dto';

// We use this interface to both adapter and application service
export interface IProviderService {
    ping(): Promise<any>;
    search(query: ProviderQuery): Promise<IProviderAsset[]>;
    getPrice(query: ProviderPriceQuery): Promise<IProviderPrice[]>;
    getDetails(query: ProviderDetailsQuery): Promise<IProviderDetails>;
}

export interface IProviderAdapter {
    ping(): Promise<any>;
    search(query: ProviderQuery): Promise<IProviderAsset[]>;
    getPrice(query: ProviderPriceQuery): Promise<IProviderPrice[]>;
    getDetails(query: ProviderDetailsQuery): Promise<IProviderDetails>;
}
