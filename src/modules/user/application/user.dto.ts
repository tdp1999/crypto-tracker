import { createEntityQuerySchema } from '@core/factories/query.factory';
import { UserSchema } from '@core/features/user/user.entity';
import { z } from 'zod';

// TODO: Find a better place for this const
export const visibleColumns = ['id', 'email', 'status', 'createdAt', 'updatedAt'] as const;

export const UserQuerySchema = createEntityQuerySchema(
    visibleColumns,
    UserSchema.pick({ email: true, status: true }).shape,
);

/* DTOs */
export type UserQueryDto = z.infer<typeof UserQuerySchema>;
