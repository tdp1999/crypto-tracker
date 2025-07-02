import { IRepository } from '@core/interfaces/repository.interface';
import { Id } from '@core/types/common.type';
import { PortfolioHolding } from '../../domain/entities/portfolio-holding.entity';
import { PortfolioHoldingQueryDto } from '../portfolio.dto';

export type IPortfolioHoldingRepository = IRepository<PortfolioHolding, PortfolioHoldingQueryDto> & {
    findByPortfolioId(portfolioId: Id): Promise<PortfolioHolding[]>;

    findByPortfolioAndTokenSymbol(portfolioId: Id, refId: string): Promise<PortfolioHolding | null>;

    /**
     * Efficiently check if a token exists in portfolio without fetching full entity
     */
    existsByPortfolioAndTokenSymbol(portfolioId: Id, refId: string): Promise<boolean>;

    findActiveByPortfolioId(portfolioId: Id): Promise<PortfolioHolding[]>;
};
