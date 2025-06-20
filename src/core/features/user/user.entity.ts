import { BaseModel } from '@core/abstractions/model.base';
import { BadRequestError } from '@core/errors/domain.error';
import { ERR_COMMON_EMPTY_PAYLOAD } from '@core/errors/messages/common.error';
import { ErrorLayer } from '@core/errors/types/error-layer.type.error';
import { AuditableSchema } from '@core/schema/auditable.schema';
import { EmailSchema, IdSchema, PasswordSchema } from '@core/schema/common.schema';
import { Email, Id, Password } from '@core/types/common.type';
import { hashByBcrypt } from '@shared/utils/hash.util';
import { IdentifierValue } from '@shared/vos/identifier.value';
import { TemporalValue } from '@shared/vos/temporal.value';
import { z } from 'zod';
import { ERR_USER_PASSWORD_NOT_PROVIDED } from './user.error';

export enum USER_STATUS {
    ACTIVE = 'active',
    PENDING = 'pending',
    INACTIVE = 'inactive',
    BANNED = 'banned',
    DELETED = 'deleted',
}

export const UserSchema = z.object({
    id: IdSchema,
    email: EmailSchema,
    password: PasswordSchema,
    salt: z.string(),

    isSystem: z.boolean().optional().default(false),
    isManualRegistration: z.boolean().optional().default(false),
    status: z.nativeEnum(USER_STATUS).default(USER_STATUS.ACTIVE),

    ...AuditableSchema.shape,
});

export const UserCreateSchema = UserSchema.pick({
    email: true,
    isSystem: true,
    isManualRegistration: true,
    status: true,
})
    .extend({ rawPassword: PasswordSchema.optional(), hashedPassword: z.string().optional() })
    .refine((data) => data.rawPassword !== undefined || data.hashedPassword !== undefined, {
        message: ERR_USER_PASSWORD_NOT_PROVIDED,
    });

export const UserUpdateSchema = UserSchema.omit({ id: true })
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
        message: ERR_COMMON_EMPTY_PAYLOAD,
        path: ['$'],
    });

export type IUser = z.infer<typeof UserSchema>;

export class User extends BaseModel implements IUser {
    readonly email: Email;
    readonly password: Password;
    readonly salt: string;
    readonly status: USER_STATUS;

    /* Created by system */
    readonly isSystem: boolean;

    /* Created by manual registration */
    readonly isManualRegistration: boolean;

    private constructor(props: Partial<IUser>) {
        super(props);
        Object.assign(this, props);
    }

    static async create(raw: Partial<IUser>, createdById: Id): Promise<User> {
        const { success, data, error } = UserCreateSchema.safeParse(raw);
        if (!success) throw BadRequestError(error, { layer: ErrorLayer.DOMAIN, remarks: 'User creation failed' });

        const password = data.hashedPassword ?? (await hashByBcrypt(data.rawPassword!));

        return new User({
            ...data,
            password,
            salt: '',
            id: IdentifierValue.v7(),
            createdById,
            updatedById: createdById,
        });
    }

    static update(raw: IUser, updatedById: Id): User {
        const newData = { ...this, ...raw, updatedAt: TemporalValue.now, updatedById };
        const { success, error } = UserUpdateSchema.safeParse(newData);
        if (!success) throw BadRequestError(error, { layer: ErrorLayer.DOMAIN, remarks: 'User update failed' });

        return new User(newData);
    }

    static fromPersistence(raw: IUser): User {
        return new User(raw);
    }
}
