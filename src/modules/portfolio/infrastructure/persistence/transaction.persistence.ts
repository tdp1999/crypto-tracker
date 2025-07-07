// FLAG: PENDING VERIFICATION
import { BasePersistence } from '@core/abstractions/persistence.base';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { ITransaction, TransactionType } from '../../domain/entities/transaction.entity';
import { PortfolioPersistence } from './portfolio.persistence';

@Entity('transactions')
@Index('IDX_transactions_portfolio_timestamp', ['portfolioId', 'timestamp'])
@Index('IDX_transactions_portfolio_token', ['portfolioId', 'tokenSymbol'])
@Index('IDX_transactions_deleted_at', ['deletedAt'])
@Index('IDX_transactions_external_id', ['externalId'])
export class TransactionPersistence extends BasePersistence implements ITransaction {
    @Column({ name: 'portfolio_id', type: 'uuid' })
    portfolioId: string;

    @ManyToOne(() => PortfolioPersistence, {
        onDelete: 'CASCADE',
        createForeignKeyConstraints: false,
    })
    @JoinColumn({ name: 'portfolio_id' })
    portfolio: PortfolioPersistence;

    @Column({ name: 'ref_id', type: 'varchar', length: 20 })
    refId: string;

    @Column({ name: 'token_symbol', type: 'varchar', length: 20 })
    tokenSymbol: string;

    @Column({ name: 'token_name', type: 'varchar', length: 100 })
    tokenName: string;

    @Column({ name: 'token_decimals', type: 'integer', default: 18 })
    tokenDecimals: number;

    @Column({ name: 'token_logo_url', type: 'text', nullable: true })
    tokenLogoUrl?: string | null;

    @Column({ name: 'amount', type: 'decimal', precision: 36, scale: 18 })
    amount: number;

    @Column({ name: 'price', type: 'decimal', precision: 36, scale: 18 })
    price: number;

    @Column({ name: 'type', type: 'enum', enum: TransactionType })
    type: TransactionType;

    @Column({ name: 'cash_flow', type: 'decimal', precision: 36, scale: 18, nullable: true })
    cashFlow?: number | null;

    @Column({ name: 'fees', type: 'decimal', precision: 36, scale: 18, default: 0 })
    fees: number;

    @Column({ name: 'timestamp', type: 'timestamp with time zone' })
    timestamp: string;

    @Column({ name: 'external_id', type: 'uuid', nullable: true })
    externalId?: string | null;

    @Column({ name: 'notes', type: 'text', nullable: true })
    notes?: string | null;
}
