export enum USER_STATUS {
    ACTIVE = 'active',
    PENDING = 'pending',
    INACTIVE = 'inactive',
    BANNED = 'banned',
    DELETED = 'deleted',
}

export type UserValidityResult =
    | { isValid: true; status: USER_STATUS.ACTIVE }
    | {
          isValid: false;
          status: USER_STATUS.INACTIVE | USER_STATUS.DELETED | USER_STATUS.BANNED | USER_STATUS.PENDING;
          invalidMessage?: string;
      };
