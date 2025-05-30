import { ITokenPrice } from '@modules/asset/domain/token-price.entity';

export interface ITokenPriceRepository {
    upsert(tokenId: string, priceData: Partial<ITokenPrice>): Promise<ITokenPrice>;
    findByTokenId(tokenId: string): Promise<ITokenPrice | null>;
    findStale(olderThan: bigint): Promise<ITokenPrice[]>;
    findByDataSource(dataSource: string): Promise<ITokenPrice[]>;
}
