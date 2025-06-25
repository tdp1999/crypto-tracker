import { DataSource, IProviderDetails } from '@core/features/provider/provider-asset.entity';
import { ProviderDetailsQuery } from '../../../application/provider.dto';
import { ICoinGeckoDetails } from '../coingecko.interface';
import { ITransformer } from './transformer.interface';

export class DetailTransformer implements ITransformer<ICoinGeckoDetails, IProviderDetails, ProviderDetailsQuery> {
    transformQuery(query: ProviderDetailsQuery): Record<string, any> {
        return {
            id: query.id,
            localization: false,
            tickers: false,
            market_data: true,
            community_data: false,
            developer_data: false,
            sparkline: false,
        };
    }

    transform(data: ICoinGeckoDetails): IProviderDetails {
        return {
            id: data.id,
            name: data.name,
            symbol: data.symbol,
            description: data.description.en,
            genesis_date: data.genesis_date,
            country_origin: data.country_origin,
            categories: data.categories,
            logo: data.image.large,
            dataSource: DataSource.COINGECKO,
            price: data.market_data.current_price.usd,
            marketCap: data.market_data.market_cap.usd,
            volumn24h: data.market_data.total_volume.usd,
            percentChange24h: data.market_data.price_change_percentage_24h,
            lastUpdated: data.market_data.last_updated,
        };
    }
}
