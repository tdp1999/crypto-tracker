import { IProviderDetails, IProviderPrice } from '@core/features/provider/provider-asset.entity';

export type IPortfolioProviderRepository = {
    getTokenDetails(refId: string): Promise<IProviderDetails>;
    getTokenPrices(refIds: string[]): Promise<IProviderPrice[]>;
};
