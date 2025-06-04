export interface ICoinGeckoCoin {
    id: string;
    name: string;
    api_symbol: string;
    symbol: string;
    market_cap_rank: number;
    thumb: string;
    large: string;
}

export interface ICoinGeckoSearchRawResponse {
    coins: ICoinGeckoCoin[];
    exchanges: unknown[];
    icos: unknown[];
    categories: unknown[];
    nfts: unknown[];
}

export interface ICoinGeckoPrice {
    usd: number;
    usd_market_cap: number;
    usd_24h_vol: number;
    usd_24h_change: number;
    last_updated_at: string;
}

export interface ICoinGeckoDetails {
    id: string;
    symbol: string;
    name: string;
    web_slug: string;
    description: {
        en: string;
    };
    country_origin: string;
    genesis_date: string;
    market_cap_rank: number;
    categories: string[];
    image: {
        thumb: string;
        small: string;
        large: string;
    };
    market_data: {
        current_price: { usd: number };
        market_cap: { usd: number };
        total_volume: { usd: number };
        price_change_percentage_24h: number;
        price_change_percentage_7d: number;
        price_change_percentage_1y: number;
        last_updated: string;
    };
}

export interface ICoinGeckoPriceRawResponse {
    [key: string]: ICoinGeckoPrice;
}
