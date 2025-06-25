import { IRepository } from '@core/interfaces/repository.interface';
import { Id } from '@core/types/common.type';
import { Portfolio } from '../../domain/entities/portfolio.entity';
import { PortfolioQueryDto } from '../portfolio.dto';

export type IPortfolioRepository = IRepository<Portfolio, PortfolioQueryDto> & {
    countByUserId(userId: Id): Promise<number>;
    findByHoldingId(holdingId: Id): Promise<Portfolio | null>;
    findByUserAndName(userId: Id, name: string): Promise<Portfolio | null>;
};
