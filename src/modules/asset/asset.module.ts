import { ClientModule } from '@core/features/client/client.module';
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';

// Persistence entities
import { TokenPricePersistence } from './infrastructure/persistence/token-price.persistence';
import { TokenPersistence } from './infrastructure/persistence/token.persistence';

// Repositories
import { TokenPriceRepository } from './infrastructure/repositories/token-price.repository';
import { TokenRepository } from './infrastructure/repositories/token.repository';

// Command handlers
import { AddTokenCommandHandler } from './application/commands/add-token.command';
import { UpdateTokenPriceCommandHandler } from './application/commands/update-token-price.command';
import { UpdateTokenCommandHandler } from './application/commands/update-token.command';

// Query handlers
import { GetTokenPriceQueryHandler } from './application/queries/get-token-price.query';
import { GetTokenQueryHandler } from './application/queries/get-token.query';
import { SearchTokensQueryHandler } from './application/queries/search-tokens.query';

// Tokens
import { ASSET_TOKENS } from './application/asset.token';

// Controllers
import { AssetController } from './infrastructure/controller/asset.controller';

const commandHandlers = [AddTokenCommandHandler, UpdateTokenCommandHandler, UpdateTokenPriceCommandHandler];

const queryHandlers = [GetTokenQueryHandler, SearchTokensQueryHandler, GetTokenPriceQueryHandler];

const repositories = [
    {
        provide: ASSET_TOKENS.REPOSITORIES.TOKEN,
        useClass: TokenRepository,
    },
    {
        provide: ASSET_TOKENS.REPOSITORIES.TOKEN_PRICE,
        useClass: TokenPriceRepository,
    },
];

@Module({
    imports: [
        CqrsModule,
        TypeOrmModule.forFeature([TokenPersistence, TokenPricePersistence]),
        ClientModule.registerAsync(),
    ],
    controllers: [AssetController],
    providers: [...commandHandlers, ...queryHandlers, ...repositories],
    exports: [...repositories],
})
export class AssetModule {}
