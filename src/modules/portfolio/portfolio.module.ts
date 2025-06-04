import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreatePortfolioCommandHandler } from './application/commands/create-portfolio.command';
import { DeletePortfolioCommandHandler } from './application/commands/delete-portfolio.command';
import { UpdatePortfolioCommandHandler } from './application/commands/update-portfolio.command';
import { DetailPortfolioQueryHandler } from './application/queries/detail-portfolio.query';
import { ListPortfolioQueryHandler } from './application/queries/list-portfolio.query';
import { PortfolioOwnershipQueryHandler } from './application/queries/portfolio-ownership.query';
import { PORTFOLIO_TOKENS } from './application/portfolio.token';
import { PortfolioController } from './infrastructure/portfolio.controller';
import { PortfolioPersistence } from './infrastructure/portfolio.persistence';
import { PortfolioRepository } from './infrastructure/portfolio.repository';

const CommandHandlers = [CreatePortfolioCommandHandler, UpdatePortfolioCommandHandler, DeletePortfolioCommandHandler];

const QueryHandlers = [ListPortfolioQueryHandler, DetailPortfolioQueryHandler, PortfolioOwnershipQueryHandler];

@Module({
    controllers: [PortfolioController],
    imports: [TypeOrmModule.forFeature([PortfolioPersistence]), CqrsModule],
    providers: [
        {
            provide: PORTFOLIO_TOKENS.REPOSITORIES,
            useClass: PortfolioRepository,
        },
        ...CommandHandlers,
        ...QueryHandlers,
    ],
    exports: [
        // Export portfolio ownership query for Asset module to use
        PortfolioOwnershipQueryHandler,
        PORTFOLIO_TOKENS.REPOSITORIES,
    ],
})
export class PortfolioModule {}
