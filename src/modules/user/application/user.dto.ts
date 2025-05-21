import { createEntityQuerySchema } from '@core/factories/query.factory';
import { UserCreateSchema, UserSchema, UserUpdateSchema } from '@core/features/user/user.entity';
import { DetailQuerySchema } from '@core/schema/query.schema';
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
