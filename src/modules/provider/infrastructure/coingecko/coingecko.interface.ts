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
    last_updated_at: bigint;
}

export interface ICoinGeckoPriceRawResponse {
    [key: string]: ICoinGeckoPrice;
}
