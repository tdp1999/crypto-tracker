import { BasePersistence } from '@core/abstractions/persistence.base';
import { IPortfolio } from '@modules/portfolio/domain/portfolio.entity';
import { Column, Entity } from 'typeorm';

@Entity('portfolios')
export class PortfolioEntity extends BasePersistence implements IPortfolio {
    @Column()
    name: string;

    @Column({ nullable: true })
    description?: string;

    @Column()
    userId: string;

    @Column({ default: false })
    isDefault: boolean;
}
