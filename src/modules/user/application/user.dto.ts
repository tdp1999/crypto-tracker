import { UserCreateSchema, UserSchema, UserUpdateSchema } from '@core/domain/entities/user.entity';
import { createEntityQuerySchema } from '@core/factories/query.factory';
import { DetailQuerySchema } from '@core/schema/query.schema';
import { Id } from '@core/types/common.type';
import { DetailQueryDto } from '@core/types/query.type';
import { z } from 'zod';

// TODO: Find a better place for this const
export const visibleColumns = ['id', 'email', 'status', 'createdAt', 'updatedAt'] as const;

export const UserQuerySchema = createEntityQuerySchema(
    visibleColumns,
    UserSchema.pick({ email: true, status: true }).shape,
);

export const UserDeleteSchema = DetailQuerySchema;

/* DTOs */
export type UserQueryDto = z.infer<typeof UserQuerySchema>;
export type UserCreateDto = z.infer<typeof UserCreateSchema>;
export type UserUpdateDto = z.infer<typeof UserUpdateSchema>;
export type UserDeleteDto = z.infer<typeof UserDeleteSchema>;

/* Commands */
export type UserCreateCommand = {
    dto: UserCreateDto;
    createdById: Id | null;
};

export type UserUpdateCommand = {
    id: Id;
    dto: UserUpdateDto;
    updatedById: Id | null;
};

export type UserDeleteCommand = {
    id: Id;
    deletedById: Id | null;
};

/* Queries */
export type UserDetailQuery = DetailQueryDto;

export type UserListQuery = {
    dto: UserQueryDto;
};
