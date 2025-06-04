import { BasePersistence } from '@core/abstractions/persistence.base';
import { ITokenPrice } from '@modules/asset/domain/token-price.entity';
import { Column, Entity, Index, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { TokenPersistence } from './token.persistence';

@Entity('token_prices')
@Index('IDX_token_prices_token_id', ['tokenId'])
export class TokenPricePersistence extends BasePersistence implements ITokenPrice {
    @PrimaryColumn({ name: 'token_id' })
    tokenId: string;

    // Relations for modeling purposes (no foreign keys in DB)
    @OneToOne(() => TokenPersistence, (token) => token.currentPrice, { createForeignKeyConstraints: false })
    @JoinColumn({ name: 'token_id' })
    token: TokenPersistence;

    @Column({ name: 'ref_id', length: 100, unique: true })
    refId: string;

    @Column({ name: 'price_usd', type: 'decimal', precision: 20, scale: 8 })
    priceUsd: number;

    @Column({ name: 'market_cap', type: 'decimal', precision: 20, scale: 2, nullable: true })
    marketCap?: number;

    @Column({ name: 'volume_24h', type: 'decimal', precision: 20, scale: 2, nullable: true })
    volume24h?: number;

    @Column({ name: 'price_change_24h', type: 'decimal', precision: 10, scale: 4, nullable: true })
    priceChange24h?: number;

    @Column({ name: 'data_source', length: 50, nullable: true })
    dataSource?: string;
}
