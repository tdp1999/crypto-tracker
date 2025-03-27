// import { CACHE_MANAGER } from '@nestjs/cache-manager';
// import { Inject, Injectable, Logger } from '@nestjs/common';
// import { Cache } from 'cache-manager';
// import { HttpService } from '@nestjs/axios';
// import { ConfigService } from '@nestjs/config';
// import { axiosObservableToPromise } from '@shared/utils/axios.util';
// import { InternalServerError } from '@core/errors/domain.error';
// import { COIN_LIST_CACHE_TTL, COINGECKO_PROVIDER_URL_PATH_DICTIONARY } from './coingecko.constant';
// import { ICoinGeckoCoin } from './coingecko.interface';

// @Injectable()
// export class CoinListCacheService {
//     private readonly logger = new Logger(CoinListCacheService.name);
//     private readonly url: string;
//     private readonly CACHE_KEY = 'coingecko_coins_list';

//     constructor(
//         @Inject(CACHE_MANAGER) private cacheManager: Cache,
//         private readonly httpService: HttpService,
//         private readonly configService: ConfigService,
//     ) {
//         const url = this.configService.get<string>('general.coingeckoProviderUrl');
//         const key = this.configService.get<string>('general.coingeckoProviderKey');

//         if (!url) {
//             throw InternalServerError('Coingecko provider URL is not defined', {
//                 layer: 'infrastructure',
//             });
//         }

//         if (!key) {
//             throw InternalServerError('Coingecko provider key is not defined', {
//                 layer: 'infrastructure',
//             });
//         }

//         this.url = `${url}/:PATH?x_cg_demo_api_key=${key}:QUERY_PARAMS`;
//     }

//     async getCoinsList(): Promise<ICoinGeckoCoin[]> {
//         try {
//             // Try to get from cache first
//             const cachedData = await this.cacheManager.get<ICoinGeckoCoin[]>(this.CACHE_KEY);

//             if (cachedData) {
//                 this.logger.log('Retrieved coin list from cache');
//                 return cachedData;
//             }

//             // If not in cache, fetch from API
//             this.logger.log('Fetching coin list from CoinGecko API');
//             return this.fetchAndCacheCoinsList();
//         } catch (error) {
//             this.logger.error('Failed to get coins list from cache', error);
//             // If cache fails, try to fetch directly
//             return this.fetchAndCacheCoinsList();
//         }
//     }

//     async fetchAndCacheCoinsList(): Promise<ICoinGeckoCoin[]> {
//         try {
//             const url = this._resolveUrl(COINGECKO_PROVIDER_URL_PATH_DICTIONARY.coinsList);
//             const coinsList = await axiosObservableToPromise<ICoinGeckoCoin[]>(this.httpService.get(url));

//             try {
//                 // Store in cache
//                 await this.cacheManager.set(this.CACHE_KEY, coinsList, COIN_LIST_CACHE_TTL * 1000);
//                 this.logger.log(`Cached ${coinsList.length} coins for ${COIN_LIST_CACHE_TTL} seconds`);
//             } catch (cacheError) {
//                 // Just log if caching fails, but still return the data
//                 this.logger.error('Failed to cache coin list', cacheError);
//             }

//             return coinsList;
//         } catch (error) {
//             this.logger.error('Failed to fetch coin list from CoinGecko API', error);
//             throw InternalServerError('Failed to fetch coin list from CoinGecko API', {
//                 layer: 'infrastructure',
//             });
//         }
//     }

//     async refreshCache(): Promise<void> {
//         await this.fetchAndCacheCoinsList();
//         this.logger.log('Coin list cache has been refreshed');
//     }

//     async getCoinById(id: string): Promise<ICoinGeckoCoin | undefined> {
//         const coins = await this.getCoinsList();
//         return coins.find((coin) => coin.id === id);
//     }

//     async searchCoins(query: string): Promise<ICoinGeckoCoin[]> {
//         const coins = await this.getCoinsList();
//         const lowerQuery = query.toLowerCase();

//         return coins.filter(
//             (coin) =>
//                 coin.id.toLowerCase().includes(lowerQuery) ||
//                 coin.name.toLowerCase().includes(lowerQuery) ||
//                 coin.symbol.toLowerCase().includes(lowerQuery),
//         );
//     }

//     private _resolveUrl(path: string, query: Record<string, any> = {}): string {
//         let queryString = Object.entries(query)
//             .map(([key, value]) => `${key}=${value}`)
//             .join('&');

//         queryString = queryString ? `&${queryString}` : '';

//         return this.url.replace(':PATH', path).replace(':QUERY_PARAMS', queryString);
//     }
// }
