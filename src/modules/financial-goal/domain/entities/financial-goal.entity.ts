import { BaseModel, IBaseModelProps } from '@core/abstractions/model.base';
import { Id } from '@core/types/common.type';
import { IdentifierValue } from '@shared/vos/identifier.value';
import { TemporalValue } from '@shared/vos/temporal.value';

export interface IFinancialGoalProps extends IBaseModelProps {
    userId: Id;
    name: string;
    targetDate: string;
    isActive: boolean;
}

export type ICreateFinancialGoalPayload = Pick<IFinancialGoalProps, 'name' | 'targetDate'>;

export type IUpdateFinancialGoalPayload = Pick<IFinancialGoalProps, 'name' | 'targetDate' | 'isActive'>;

export class FinancialGoal extends BaseModel {
    readonly props: IFinancialGoalProps;

    private constructor(props: IFinancialGoalProps) {
        super(props);
        this.props = props;
    }

    /* Static Methods */
    static fromPersistence(raw: IFinancialGoalProps): FinancialGoal {
        return new FinancialGoal(raw);
    }

    static create(data: ICreateFinancialGoalPayload, userId: Id, createdById: Id): FinancialGoal {
        const id = IdentifierValue.v7();
        const now = TemporalValue.now;

        return new FinancialGoal({
            ...data,
            userId,
            id,
            createdById,
            updatedById: createdById,
            createdAt: now,
            updatedAt: now,
            isActive: false,
        });
    }

    /* Public Methods */
    public update(data: Partial<IFinancialGoalProps>, updatedById: Id): FinancialGoal {
        const newProps = { ...this.props, ...data, updatedById };

        return new FinancialGoal(newProps);
    }

    public delete(deletedById: Id): FinancialGoal {
        const newProps = { ...this.props, deletedById, deletedAt: TemporalValue.now };

        return new FinancialGoal(newProps);
    }
}
