import { PASSWORD_REGEX } from '@shared/constants/regex.constant';
import { z } from 'zod';
import { ERR_COMMON_INVALID_EMAIL, ERR_COMMON_INVALID_PASSWORD } from '../errors/messages/common.error';

export const IdSchema = z.string().uuid();
export const TimestampSchema = z.string().datetime();

export const RemarkSchema = z.string().max(1000);
export const DecimalSchema = z.number().multipleOf(0.000000000000000001);

export const EmailSchema = z.string().email(ERR_COMMON_INVALID_EMAIL);
export const PasswordSchema = z.string().regex(PASSWORD_REGEX, ERR_COMMON_INVALID_PASSWORD);
