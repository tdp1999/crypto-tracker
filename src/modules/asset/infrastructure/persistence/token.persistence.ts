import { BasePersistence } from '@core/abstractions/persistence.base';
import { IToken } from '@modules/asset/domain/token.entity';
import { Column, Entity, Index } from 'typeorm';

@Entity('tokens')
@Index(['symbol'])
@Index(['refId'])
@Index(['isActive'])
export class TokenEntity extends BasePersistence implements IToken {
    @Column({ length: 20, unique: true })
    symbol: string;

    @Column({ length: 100 })
    name: string;

    @Column({ name: 'ref_id', length: 100 })
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
}
