import { DataSource, IProviderAsset } from '@core/features/provider/provider-asset.entity';
import { ProviderQuery } from '../../../application/provider.dto';
import { ICoinGeckoCoin } from '../coingecko.interface';
import { ITransformer } from './transformer.interface';

export class SearchTransformer implements ITransformer<ICoinGeckoCoin[], IProviderAsset[], ProviderQuery> {
    transformQuery(query: ProviderQuery): Record<string, any> {
        return { query: query.key };
    }

    transform(data: ICoinGeckoCoin[]): IProviderAsset[] {
        return data.map((item: ICoinGeckoCoin) => ({
            id: item.id,
            name: item.name,
            symbol: item.symbol,
            logo: item.thumb,
            image: item.large,
            dataSource: DataSource.COINGECKO,
        }));
    }
}
