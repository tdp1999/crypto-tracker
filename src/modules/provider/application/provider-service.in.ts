import { IProviderAsset } from '../domain/provider-asset.entity';
import { ProviderQuery } from './provider.dto';

// We use this interface to both adapter and application service
export interface IProviderService {
    ping(): Promise<any>;
    search(query: ProviderQuery): Promise<IProviderAsset[]>;
}

export interface IProviderAdapter {
    ping(): Promise<any>;
    search(query: ProviderQuery): Promise<IProviderAsset[]>;
}
