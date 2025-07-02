import { BasePersistence } from '@core/abstractions/persistence.base';
import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { IPortfolioHolding } from '../../domain/entities/portfolio-holding.entity';
import { PortfolioPersistence } from './portfolio.persistence';

@Entity('portfolio_holdings')
@Unique('UQ_portfolio_holdings_portfolio_token', ['portfolioId', 'tokenSymbol'])
@Index('IDX_portfolio_holdings_portfolio_id', ['portfolioId'])
@Index('IDX_portfolio_holdings_token_symbol', ['tokenSymbol'])
@Index('IDX_portfolio_holdings_deleted_at', ['deletedAt'])
export class PortfolioHoldingPersistence extends BasePersistence implements IPortfolioHolding {
    @Column({ name: 'portfolio_id', type: 'uuid' })
    portfolioId: string;

    @ManyToOne(() => PortfolioPersistence, (portfolio) => portfolio.holdings, {
        onDelete: 'CASCADE',
        createForeignKeyConstraints: false,
    })
    @JoinColumn({ name: 'portfolio_id' })
    portfolio: PortfolioPersistence;

    @Column({ name: 'ref_id', type: 'varchar', length: 20 })
    refId: string;

    @Column({ name: 'token_symbol', type: 'varchar', length: 20 })
    tokenSymbol: string;

    @Column({ name: 'token_name', type: 'varchar', length: 100, nullable: true })
    tokenName?: string;

    @Column({ name: 'token_decimals', type: 'integer', default: 18 })
    tokenDecimals: number;

    @Column({ name: 'token_logo_url', type: 'text', nullable: true })
    tokenLogoUrl?: string;

    @Column({ name: 'is_stablecoin', type: 'boolean', default: false })
    isStablecoin: boolean;

    @Column({ name: 'stablecoin_peg', type: 'varchar', length: 10, nullable: true })
    stablecoinPeg?: string;
}
