import { IProviderAsset, IProviderPrice } from '../domain/provider-asset.entity';
import { ProviderPriceQuery, ProviderQuery } from './provider.dto';

// We use this interface to both adapter and application service
export interface IProviderService {
    ping(): Promise<any>;
    search(query: ProviderQuery): Promise<IProviderAsset[]>;
    getPrice(query: ProviderPriceQuery): Promise<IProviderPrice[]>;
}

export interface IProviderAdapter {
    ping(): Promise<any>;
    search(query: ProviderQuery): Promise<IProviderAsset[]>;
    getPrice(query: ProviderPriceQuery): Promise<IProviderPrice[]>;
}
