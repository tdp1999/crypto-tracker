import { FinancialGoalAction } from '@core/actions/financial-goal.action';
import { RpcClientRepository } from '@core/decorators/client.rpc.decorator';
import { CLIENT_PROXY } from '@core/features/client/client.token';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { observableToPromise } from '@shared/utils/observable.util';
import { IAssetFinancialGoal } from '../../application/asset.type';
import { IFinancialGoalRepository } from '../../application/ports/financial-goal-repository.out.port';

@Injectable()
@RpcClientRepository()
export class FinancialGoalRpcRepository implements IFinancialGoalRepository {
    constructor(@Inject(CLIENT_PROXY) private readonly client: ClientProxy) {}

    async getActive(userId: string): Promise<IAssetFinancialGoal | null> {
        return await observableToPromise(this.client.send(FinancialGoalAction.GET_ACTIVE, { userId }));
    }
}
