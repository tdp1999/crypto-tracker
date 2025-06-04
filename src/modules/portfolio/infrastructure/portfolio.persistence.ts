import { BasePersistence } from '@core/abstractions/persistence.base';
import { IPortfolio } from '@modules/portfolio/domain/portfolio.entity';
import { Column, Entity, Index, Unique } from 'typeorm';

@Entity('portfolios')
@Unique('UQ_portfolios_name', ['name'])
@Index('IDX_portfolios_user_id', ['userId'])
@Index('IDX_portfolios_is_default', ['isDefault'])
export class PortfolioPersistence extends BasePersistence implements IPortfolio {
    @Column({ name: 'name', type: 'varchar', length: 255 })
    name: string;

    @Column({ name: 'description', type: 'text', nullable: true })
    description?: string;

    @Column({ name: 'user_id', type: 'uuid' })
    userId: string;

    @Column({ name: 'is_default', default: false })
    isDefault: boolean;
}
