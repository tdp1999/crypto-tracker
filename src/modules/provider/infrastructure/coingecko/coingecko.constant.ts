export const COINGECKO_DEFAULT_PAGE_SIZE = 100;
export const COINGECKO_DEFAULT_PAGE = 1;
export const COINGECKO_DEFAULT_PRICE_CHANGE_PERCENTAGE = '24h';

export const COINGECKO_PROVIDER_URL_PATH_DICTIONARY = {
    ping: 'ping',
    search: 'search',
    price: 'simple/price',
} as const;

export const COINGECKO_CURRENCY_DICTIONARY = {
    USD: 'usd',
} as const;

export const COINGECKO_LOCALE_DICTIONARY = {
    EN: 'en',
} as const;
