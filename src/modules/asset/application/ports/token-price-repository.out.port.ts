import { ITokenPrice } from '@modules/asset/domain/token-price.entity';

export interface ITokenPriceRepository {
    // Persistence
    upsert(tokenId: string, priceData: ITokenPrice): Promise<boolean>;
    findByTokenId(tokenId: string): Promise<ITokenPrice | null>;
    findStale(olderThan: string): Promise<ITokenPrice[]>;
    findByDataSource(dataSource: string): Promise<ITokenPrice[]>;

    // RPC
    // This repository also act as an adapter
    getLatestPrice(refId: string): Promise<Partial<ITokenPrice> | null>;
}
