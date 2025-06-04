import { ProviderPriceQuery } from '../../../application/provider.dto';
import { DataSource, IProviderPrice } from '../../../domain/provider-asset.entity';
import { COINGECKO_CURRENCY_DICTIONARY } from '../coingecko.constant';
import { ICoinGeckoPriceRawResponse } from '../coingecko.interface';
import { ITransformer } from './transformer.interface';

export class PriceTransformer
    implements ITransformer<ICoinGeckoPriceRawResponse, IProviderPrice[], ProviderPriceQuery>
{
    transformQuery(query: ProviderPriceQuery): Record<string, any> {
        return {
            ids: query.ids,
            vs_currencies: COINGECKO_CURRENCY_DICTIONARY.USD,
            include_market_cap: true,
            include_24hr_vol: true,
            include_24hr_change: true,
            include_last_updated_at: true,
        };
    }

    transform(data: ICoinGeckoPriceRawResponse): IProviderPrice[] {
        return Object.entries(data).map(([key, value]) => ({
            id: key,
            price: value.usd,
            marketCap: value.usd_market_cap,
            volumn24h: value.usd_24h_vol,
            percentChange24h: value.usd_24h_change,
            lastUpdated: value.last_updated_at,
            dataSource: DataSource.COINGECKO,
        }));
    }
}
