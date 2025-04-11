import { IUser } from '@core/features/user/user.entity';
import { USER_STATUS, UserValidityResult } from '@core/features/user/user.type';
import { Injectable } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';

// Query class
export class UserValidityQuery {
    constructor(public readonly payload: { user: IUser }) {}
}

@Injectable()
@QueryHandler(UserValidityQuery)
export class UserValidityQueryHandler implements IQueryHandler<UserValidityQuery, UserValidityResult> {
    async execute(query: UserValidityQuery): Promise<UserValidityResult> {
        const { user } = query.payload;
        return Promise.resolve(this._validate(user));
    }

    private _validate(user: IUser): UserValidityResult {
        if (user.deletedAt) return { isValid: false, status: USER_STATUS.DELETED };

        if (user.status !== USER_STATUS.ACTIVE) return { isValid: false, status: user.status };

        return { isValid: true, status: USER_STATUS.ACTIVE };
    }
}
