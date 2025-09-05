import { Id } from '@core/types/common.type';
import { IAssetFinancialGoal } from '../asset.type';

export interface IFinancialGoalRepository {
    getActive(userId: Id): Promise<IAssetFinancialGoal | null>;
}
