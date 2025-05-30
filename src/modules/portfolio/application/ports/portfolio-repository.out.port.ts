import { Portfolio } from '../../domain/portfolio.entity';
import { IRepository } from '@core/interfaces/repository.interface';
import { PortfolioQueryDto } from '../portfolio.dto';
import { Id } from '@core/types/common.type';

export type IPortfolioRepository = IRepository<Portfolio, PortfolioQueryDto> & {
    findByUserAndName(userId: Id, name: string): Promise<Portfolio | null>;
    countByUserId(userId: Id): Promise<number>;
    findDefaultByUserId(userId: Id): Promise<Portfolio | null>;
};
