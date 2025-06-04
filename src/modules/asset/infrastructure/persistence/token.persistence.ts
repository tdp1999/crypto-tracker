import { BasePersistence } from '@core/abstractions/persistence.base';
import { IToken } from '@modules/asset/domain/token.entity';
import { Column, Entity, Index, OneToOne } from 'typeorm';
import { TokenPricePersistence } from './token-price.persistence';

@Entity('tokens')
@Index('IDX_tokens_symbol', ['symbol'])
@Index('IDX_tokens_ref_id', ['refId'])
@Index('IDX_tokens_is_active', ['isActive'])
export class TokenPersistence extends BasePersistence implements IToken {
    @Column({ length: 20, unique: true })
    symbol: string;

    @Column({ length: 100 })
    name: string;

    @Column({ name: 'ref_id', length: 100, unique: true })
    refId: string;

    @Column({ default: 18 })
    decimals: number;

    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    @Column({ name: 'is_stablecoin', default: false })
    isStablecoin: boolean;

    @Column({ name: 'stablecoin_peg', length: 10, nullable: true })
    stablecoinPeg?: string;

    @Column({ name: 'logo_url', type: 'text', nullable: true })
    logoUrl?: string;

    // Relations for modeling purposes (no foreign keys in DB)
    @OneToOne(() => TokenPricePersistence, (price) => price.token)
    currentPrice?: TokenPricePersistence;
}
