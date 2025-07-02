import { IRepository } from '@core/interfaces/repository.interface';
import { Id } from '@core/types/common.type';
import { Portfolio } from '../../domain/entities/portfolio.entity';
import { PortfolioQueryDto } from '../portfolio.dto';

export type IPortfolioRepository = IRepository<Portfolio, PortfolioQueryDto> & {
    countByUserId(userId: Id): Promise<number>;
    findByHoldingId(holdingId: Id): Promise<Portfolio | null>;
    findByUserAndName(userId: Id, name: string): Promise<Portfolio | null>;

    /**
     * Efficiently get portfolio ownership data without fetching full entity
     * Returns minimal data needed by domain service for ownership verification
     */
    getOwnershipData(portfolioId: Id): Promise<{ userId: Id } | null>;
};
