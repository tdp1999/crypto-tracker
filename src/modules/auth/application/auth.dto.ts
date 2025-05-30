import { EmailSchema, PasswordSchema } from '@core/schema/common.schema';
import { z } from 'zod';

export const AuthRegisterSchema = z.object({ email: EmailSchema, password: PasswordSchema });
export const AuthLoginSchema = AuthRegisterSchema.merge(z.object({}));
export const AuthChangePasswordSchema = z.object({ oldPassword: PasswordSchema, newPassword: PasswordSchema });

// RPC
export const AuthUserCreateSchema = z.object({ email: EmailSchema, password: PasswordSchema });
