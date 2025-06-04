import { InternalServerError } from '@core/errors/domain.error';
import { ErrorLayer } from '@core/errors/types/error-layer.type.error';
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { axiosObservableToPromise } from '@shared/utils/observable.util';
import { IProviderAdapter } from '../../application/provider-service.in';
import { ProviderDetailsQuery, ProviderPriceQuery, ProviderQuery } from '../../application/provider.dto';
import { IProviderAsset, IProviderDetails, IProviderPrice } from '../../domain/provider-asset.entity';
import { COINGECKO_PROVIDER_URL_PATH_DICTIONARY } from './coingecko.constant';
import { COINGECKO_ERROR_MESSAGES } from './coingecko.error';
import { ICoinGeckoDetails, ICoinGeckoPriceRawResponse, ICoinGeckoSearchRawResponse } from './coingecko.interface';
import { PriceTransformer } from './transformers/price.transformer';
import { SearchTransformer } from './transformers/search.transformer';
import { DetailTransformer } from './transformers/detail.transformer';

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
            throw InternalServerError(COINGECKO_ERROR_MESSAGES.URL_NOT_FOUND, { layer: ErrorLayer.INFRASTRUCTURE });
        }

        if (!key) {
            throw InternalServerError(COINGECKO_ERROR_MESSAGES.KEY_NOT_FOUND, { layer: ErrorLayer.INFRASTRUCTURE });
        }

        this.url = `${url}/:PATH?x_cg_demo_api_key=${key}:QUERY_PARAMS`;
    }

    async ping(): Promise<any> {
        const url = this._resolveUrl(COINGECKO_PROVIDER_URL_PATH_DICTIONARY.ping);
        return axiosObservableToPromise(this.httpService.get(url));
    }

    async search(query: ProviderQuery): Promise<IProviderAsset[]> {
        const transformer = new SearchTransformer();
        const transformedQuery = transformer.transformQuery(query);
        const url = this._resolveUrl(COINGECKO_PROVIDER_URL_PATH_DICTIONARY.search, transformedQuery);
        const rawResponse = await axiosObservableToPromise<ICoinGeckoSearchRawResponse>(this.httpService.get(url));
        return transformer.transform(rawResponse.coins);
    }

    async getPrice(query: ProviderPriceQuery): Promise<IProviderPrice[]> {
        const transformer = new PriceTransformer();
        const transformedQuery = transformer.transformQuery(query);
        const url = this._resolveUrl(COINGECKO_PROVIDER_URL_PATH_DICTIONARY.price, transformedQuery);
        const rawResponse = await axiosObservableToPromise<ICoinGeckoPriceRawResponse>(this.httpService.get(url));
        return transformer.transform(rawResponse);
    }

    async getDetails(query: ProviderDetailsQuery): Promise<IProviderDetails> {
        const transformer = new DetailTransformer();
        const transformedQuery = transformer.transformQuery(query);
        const url = this._resolveUrl(COINGECKO_PROVIDER_URL_PATH_DICTIONARY.details, transformedQuery, {
            id: query.id,
        });
        const rawResponse = await axiosObservableToPromise<ICoinGeckoDetails>(this.httpService.get(url));
        return transformer.transform(rawResponse);
    }

    private _resolveUrl(
        path: string,
        query: Record<string, any> = {},
        pathParams: Record<string, string> = {},
    ): string {
        let queryString = Object.entries(query)
            .map(([key, value]) => `${key}=${value}`)
            .join('&');

        queryString = queryString ? `&${queryString}` : '';

        if (Object.keys(pathParams).length > 0) {
            for (const [key, value] of Object.entries(pathParams)) {
                path = path.replace(`:${key}`, value);
            }
        }

        return this.url.replace(':PATH', path).replace(':QUERY_PARAMS', queryString);
    }
}
