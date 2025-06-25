import { Id } from '@core/types/common.type';
import { PortfolioHolding } from '../../domain/entities/portfolio-holding.entity';

// QUESTION: Should I make this repository extend the IRepository interface? Is it necessary or redundant?
export type IPortfolioHoldingRepository = {
    add(token: PortfolioHolding): Promise<Id>;

    update(id: Id, holding: PortfolioHolding): Promise<boolean>;

    findById(id: Id): Promise<PortfolioHolding | null>;
};
