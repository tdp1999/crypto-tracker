import { ClientModule } from '@core/features/client/client.module';
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreatePortfolioCommandHandler } from './application/commands/create-portfolio.command';
import { CreateTransactionCommandHandler } from './application/commands/create-transaction.command';
import { DeletePortfolioCommandHandler } from './application/commands/delete-portfolio.command';
import { DeleteTransactionCommandHandler } from './application/commands/delete-transaction.command';
import { RegisterTokenCommandHandler } from './application/commands/register-token.command';
import { RemoveTokenCommandHandler } from './application/commands/remove-token.command';
import { UpdatePortfolioCommandHandler } from './application/commands/update-portfolio.command';
import { UpdateTransactionCommandHandler } from './application/commands/update-transaction.command';
import { PORTFOLIO_TOKENS } from './application/portfolio.token';
import { DetailPortfolioQueryHandler } from './application/queries/detail-portfolio.query';
import { GetPortfolioHoldingsQueryHandler } from './application/queries/get-portfolio-holdings.query';
import { ListPortfolioQueryHandler } from './application/queries/list-portfolio.query';
import { ListTransactionsQueryHandler } from './application/queries/list-transactions.query';
import { PortfolioOwnershipQueryHandler } from './application/queries/portfolio-ownership.query';
import { PortfolioHoldingController } from './infrastructure/controllers/portfolio-holding.controller';
import { PortfolioController } from './infrastructure/controllers/portfolio.controller';
import { TransactionController } from './infrastructure/controllers/transaction.controller';
import { PortfolioHoldingPersistence } from './infrastructure/persistence/portfolio-holding.persistence';
import { PortfolioPersistence } from './infrastructure/persistence/portfolio.persistence';
import { TransactionPersistence } from './infrastructure/persistence/transaction.persistence';
import { PortfolioHoldingRepository } from './infrastructure/repositories/portfolio-holding.repository';
import { PortfolioProviderRepository } from './infrastructure/repositories/portfolio-provider.repository';
import { PortfolioRepository } from './infrastructure/repositories/portfolio.repository';
import { TransactionRepository } from './infrastructure/repositories/transaction.repository';

const CommandHandlers = [
    CreatePortfolioCommandHandler,
    UpdatePortfolioCommandHandler,
    DeletePortfolioCommandHandler,
    RegisterTokenCommandHandler,
    RemoveTokenCommandHandler,
    CreateTransactionCommandHandler,
    UpdateTransactionCommandHandler,
    DeleteTransactionCommandHandler,
];

const QueryHandlers = [
    ListPortfolioQueryHandler,
    DetailPortfolioQueryHandler,
    PortfolioOwnershipQueryHandler,
    GetPortfolioHoldingsQueryHandler,
    ListTransactionsQueryHandler,
];

@Module({
    controllers: [PortfolioController, PortfolioHoldingController, TransactionController],
    imports: [
        ClientModule.registerAsync(),
        TypeOrmModule.forFeature([PortfolioPersistence, PortfolioHoldingPersistence, TransactionPersistence]),
        CqrsModule,
    ],
    providers: [
        {
            provide: PORTFOLIO_TOKENS.REPOSITORIES.PORTFOLIO,
            useClass: PortfolioRepository,
        },
        {
            provide: PORTFOLIO_TOKENS.REPOSITORIES.PORTFOLIO_HOLDING,
            useClass: PortfolioHoldingRepository,
        },
        {
            provide: PORTFOLIO_TOKENS.REPOSITORIES.PORTFOLIO_PROVIDER,
            useClass: PortfolioProviderRepository,
        },
        {
            provide: PORTFOLIO_TOKENS.REPOSITORIES.TRANSACTION,
            useClass: TransactionRepository,
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
