import { IProviderPrice } from '../../../domain/provider-asset.entity';
import { ICoinGeckoPriceRawResponse } from '../coingecko.interface';
import { ITransformer } from './transformer.interface';

export class PriceTransformer implements ITransformer<ICoinGeckoPriceRawResponse, IProviderPrice[]> {
    transform(data: ICoinGeckoPriceRawResponse): IProviderPrice[] {
        return Object.entries(data).map(([key, value]) => ({
            id: key,
            price: value.usd,
            marketCap: value.usd_market_cap,
            volumn24h: value.usd_24h_vol,
            percentChange24h: value.usd_24h_change,
            lastUpdated: value.last_updated_at,
        }));
    }
}
