import { BadRequestError } from '@core/errors/domain.error';
import { Id } from '@core/types/common.type';
import { Inject } from '@nestjs/common';
import { IQuery, IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ErrorLayer } from '@core/errors/types/error-layer.type.error';
import { OverallProgressCalculator } from '../../domain/services/overall-progress.service';
import { AssetDashboardDto, AssetDashboardSchema, AssetQueryDto, AssetQuerySchema } from '../asset.dto';
import { ASSET_TOKENS } from '../asset.token';
import { IAssetRepository } from '../ports/asset-repository.out.port';
import { IFinancialGoalRepository } from '../ports/financial-goal-repository.out.port';

export class ListAssetsQuery implements IQuery {
    constructor(public readonly payload: { dto: AssetQueryDto; userId: Id }) {}
}

@QueryHandler(ListAssetsQuery)
export class ListAssetsQueryHandler implements IQueryHandler<ListAssetsQuery, AssetDashboardDto> {
    constructor(
        @Inject(ASSET_TOKENS.REPOSITORIES.ASSET)
        private readonly assetRepository: IAssetRepository,

        @Inject(ASSET_TOKENS.REPOSITORIES.FINANCIAL_GOAL)
        private readonly goalRepository: IFinancialGoalRepository,

        private readonly overallProgressCalculator: OverallProgressCalculator,
    ) {}

    async execute(query: ListAssetsQuery): Promise<AssetDashboardDto> {
        const { userId, dto } = query.payload;

        // Validate payload
        const { success, error, data } = AssetQuerySchema.safeParse(dto);
        if (!success) throw BadRequestError(error, { layer: ErrorLayer.APPLICATION });

        // Auto-filter by userId for security
        const validatedDto = { ...data, userId };

        const assets = await this.assetRepository.findByUserId(userId, validatedDto);
        const totalValue = assets.reduce((sum, a) => sum + (a.props.currentValue || 0), 0);

        const items = assets.map((asset) => {
            const { currentValue, target } = asset.props;
            const proportion = totalValue > 0 ? (currentValue || 0) / totalValue : 0;

            return { proportion, target, ...asset };
        });

        // Overall progress: weighted by targets across all assets (only if an active goal exists)
        const activeGoal = await this.goalRepository.getActive(userId);
        let overallProgress: number | undefined = undefined;
        if (activeGoal) {
            const pairs = assets.map((a) => ({
                currentValue: a.props.currentValue || 0,
                targetValue: a.props.target?.props.targetValue,
            }));
            overallProgress = this.overallProgressCalculator.calculate(pairs);
        }

        return AssetDashboardSchema.parse({ totalValue, items, overallProgress });
    }
}
