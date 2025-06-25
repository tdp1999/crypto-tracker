import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreatePortfolioCommandHandler } from './application/commands/create-portfolio.command';
import { DeletePortfolioCommandHandler } from './application/commands/delete-portfolio.command';
import { UpdatePortfolioCommandHandler } from './application/commands/update-portfolio.command';
import { PORTFOLIO_TOKENS } from './application/portfolio.token';
import { DetailPortfolioQueryHandler } from './application/queries/detail-portfolio.query';
import { ListPortfolioQueryHandler } from './application/queries/list-portfolio.query';
import { PortfolioOwnershipQueryHandler } from './application/queries/portfolio-ownership.query';
import { PortfolioController } from './infrastructure/controllers/portfolio.controller';
import { PortfolioHoldingPersistence } from './infrastructure/persistence/portfolio-holding.persistence';
import { PortfolioPersistence } from './infrastructure/persistence/portfolio.persistence';
import { PortfolioHoldingRepository } from './infrastructure/repositories/portfolio-holding.repository';
import { PortfolioRepository } from './infrastructure/repositories/portfolio.repository';

const CommandHandlers = [CreatePortfolioCommandHandler, UpdatePortfolioCommandHandler, DeletePortfolioCommandHandler];

const QueryHandlers = [ListPortfolioQueryHandler, DetailPortfolioQueryHandler, PortfolioOwnershipQueryHandler];

@Module({
    controllers: [PortfolioController],
    imports: [TypeOrmModule.forFeature([PortfolioPersistence, PortfolioHoldingPersistence]), CqrsModule],
    providers: [
        {
            provide: PORTFOLIO_TOKENS.REPOSITORIES.PORTFOLIO,
            useClass: PortfolioRepository,
        },
        {
            provide: PORTFOLIO_TOKENS.REPOSITORIES.PORTFOLIO_HOLDING,
            useClass: PortfolioHoldingRepository,
        },
        ...CommandHandlers,
        ...QueryHandlers,
    ],
    exports: [
        // Export portfolio ownership query for Asset module to use
        PortfolioOwnershipQueryHandler,
        PORTFOLIO_TOKENS.REPOSITORIES.PORTFOLIO,
        PORTFOLIO_TOKENS.REPOSITORIES.PORTFOLIO_HOLDING,
    ],
})
export class PortfolioModule {}
