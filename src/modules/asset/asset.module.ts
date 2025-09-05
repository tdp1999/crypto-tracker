import { ClientModule } from '@core/features/client/client.module';
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ASSET_TOKENS } from './application/asset.token';
import { CreateAssetCommandHandler } from './application/commands/create-asset.command';
import { DeleteAssetCommandHandler } from './application/commands/delete-asset.command';
import { UpdateAssetCommandHandler } from './application/commands/update-asset.command';
import { ListAssetsQueryHandler } from './application/queries/list-assets.query';
import { OverallProgressCalculator } from './domain/services/overall-progress.service';
import { AssetController } from './infrastructure/controllers/asset.controller';
import { AssetTargetPersistence } from './infrastructure/persistence/asset-target.persistence';
import { AssetPersistence } from './infrastructure/persistence/asset.persistence';
import { AssetRepository } from './infrastructure/repositories/asset.repository';
import { FinancialGoalRpcRepository } from './infrastructure/repositories/financial-goal.rpc.repository';

const Services = [OverallProgressCalculator];
const QueryHandlers = [ListAssetsQueryHandler];
const CommandHandlers = [CreateAssetCommandHandler, UpdateAssetCommandHandler, DeleteAssetCommandHandler];

@Module({
    controllers: [AssetController],
    imports: [
        TypeOrmModule.forFeature([AssetPersistence, AssetTargetPersistence]),
        ClientModule.registerAsync(),
        CqrsModule,
    ],
    providers: [
        { provide: ASSET_TOKENS.REPOSITORIES.ASSET, useClass: AssetRepository },
        { provide: ASSET_TOKENS.REPOSITORIES.FINANCIAL_GOAL, useClass: FinancialGoalRpcRepository },

        ...Services,
        ...QueryHandlers,
        ...CommandHandlers,
    ],
})
export class AssetModule {}
