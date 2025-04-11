import { EmailSchema, PasswordSchema } from '@core/schema/common.schema';
import { z } from 'zod';

export const AuthRegisterSchema = z.object({ email: EmailSchema, password: PasswordSchema });
export const AuthLoginSchema = AuthRegisterSchema.merge(z.object({}));
export const AuthChangePasswordSchema = z.object({ oldPassword: PasswordSchema, newPassword: PasswordSchema });

export type AuthRegisterDto = z.infer<typeof AuthRegisterSchema>;
export type AuthLoginDto = z.infer<typeof AuthLoginSchema>;
export type AuthChangePasswordDto = z.infer<typeof AuthChangePasswordSchema>;

// RPC
export const AuthUserCreateSchema = z.object({ email: EmailSchema, password: PasswordSchema });

export type AuthUserCreateDto = z.infer<typeof AuthUserCreateSchema>;
