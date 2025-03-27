import { IProviderAsset } from '../../../domain/provider-asset.entity';
import { ICoinGeckoCoin } from '../coingecko.interface';
import { ITransformer } from './transformer.interface';

export class SearchTransformer implements ITransformer<ICoinGeckoCoin[], IProviderAsset[]> {
    transform(data: ICoinGeckoCoin[]): IProviderAsset[] {
        return data.map((item: ICoinGeckoCoin) => ({
            id: item.id,
            name: item.name,
            symbol: item.symbol,
            logo: item.thumb,
            image: item.large,
        }));
    }
}
