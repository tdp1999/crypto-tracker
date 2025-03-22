export interface ICoinGeckoSearchQuery {
    vs_currency: string;
    ids?: string;
    category?: string;
    order?: string;
    per_page?: number;
    page?: number;
    sparkline?: boolean;
    price_change_percentage?: string;
    locale?: string;
    precision?: string;
}

export interface ICoinGeckoAsset {
    asset_id: number;
    asset_name: string;
    asset_symbol: string;
    asset_price: number;
}
