import { BasePersistence } from '@core/abstractions/persistence.base';
import { IUser, USER_STATUS } from '@core/features/user/user.entity';
import { Column, Entity } from 'typeorm';

@Entity('users')
export class UserEntity extends BasePersistence implements IUser {
    @Column({ unique: true })
    email: string;

    // TODO: move this to application (use-case) layer, in case this logic need to change
    @Column({ select: false })
    password: string;

    @Column({ select: false })
    salt: string;

    @Column({ default: false })
    isManualRegistration: boolean;

    @Column({ default: false })
    isSystem: boolean;

    @Column({ type: 'enum', enum: USER_STATUS, default: USER_STATUS.ACTIVE })
    status: USER_STATUS;
}
