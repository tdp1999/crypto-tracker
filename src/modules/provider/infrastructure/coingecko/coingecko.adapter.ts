import { InternalServerError } from '@core/errors/domain.error';
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { axiosObservableToPromise } from '@shared/utils/axios.util';
import { IProviderAdapter } from '../../application/provider-service.in';
import { ProviderQuery } from '../../application/provider.dto';
import { IProviderAsset } from '../../domain/provider-asset.entity';
import { COINGECKO_PROVIDER_URL_PATH_DICTIONARY } from './coingecko.constant';
import { ICoinGeckoAsset, ICoinGeckoSearchQuery } from './coingecko.interface';

@Injectable()
export class CoinGeckoAdapter implements IProviderAdapter {
    private readonly url: string;

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
    ) {
        const url = this.configService.get<string>('general.coingeckoProviderUrl');
        const key = this.configService.get<string>('general.coingeckoProviderKey');

        if (!url) {
            throw InternalServerError('Coingecko provider URL is not defined', {
                layer: 'infrastructure',
            });
        }

        if (!key) {
            throw InternalServerError('Coingecko provider key is not defined', {
                layer: 'infrastructure',
            });
        }

        this.url = `${url}/:PATH?x_cg_demo_api_key=${key}:QUERY_PARAMS`;
    }

    ping() {
        const url = this._resolveUrl(COINGECKO_PROVIDER_URL_PATH_DICTIONARY.ping);
        return axiosObservableToPromise(this.httpService.get(url));
    }

    async search(query: ProviderQuery): Promise<IProviderAsset[]> {
        const transformedQuery: ICoinGeckoSearchQuery = {
            vs_currency: 'usd',
        };

        const url = this._resolveUrl(COINGECKO_PROVIDER_URL_PATH_DICTIONARY.search, transformedQuery);
        const response = await axiosObservableToPromise<ICoinGeckoAsset[]>(this.httpService.get(url));
        return this._transformData(response);
    }

    private _resolveUrl(path: string, query: Record<string, any> = {}): string {
        let queryString = Object.entries(query)
            .map(([key, value]) => `${key}=${value}`)
            .join('&');

        queryString = queryString ? `&${queryString}` : '';

        return this.url.replace(':PATH', path).replace(':QUERY_PARAMS', queryString);
    }

    private _transformData(data: ICoinGeckoAsset[]): IProviderAsset[] {
        // return data.map((item: ICoinGeckoAsset) => ({
        //     id: item.asset_id.toString(),
        //     name: item.asset_name,
        //     symbol: item.asset_symbol,
        //     price: item.asset_price,
        // }));

        return data as unknown as IProviderAsset[];
    }
}
