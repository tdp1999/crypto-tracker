import { IRepository } from '@core/interfaces/repository.interface';
import { Id } from '@core/types/common.type';
import { PortfolioHolding } from '../../domain/entities/portfolio-holding.entity';
import { PortfolioHoldingQueryDto } from '../portfolio.dto';

export type IPortfolioHoldingRepository = IRepository<PortfolioHolding, PortfolioHoldingQueryDto> & {
    findByPortfolioId(portfolioId: Id): Promise<PortfolioHolding[]>;

    findByPortfolioAndTokenSymbol(portfolioId: Id, tokenSymbol: string): Promise<PortfolioHolding | null>;

    findActiveByPortfolioId(portfolioId: Id): Promise<PortfolioHolding[]>;
};
