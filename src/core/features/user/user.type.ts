import { IUser, USER_STATUS } from './user.entity';

export type UserValidityResult =
    | { isValid: true; status: USER_STATUS.ACTIVE }
    | {
          isValid: false;
          status: USER_STATUS.INACTIVE | USER_STATUS.DELETED | USER_STATUS.BANNED | USER_STATUS.PENDING;
          invalidMessage?: string;
      };

export type UserCredentialValidityResult = { isValid: true; user: IUser } | { isValid: false; invalidMessage: string };
