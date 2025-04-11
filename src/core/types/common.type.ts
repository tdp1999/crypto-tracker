import { EmailSchema, IdSchema, PasswordSchema, TimestampSchema } from '@core/schema/common.schema';
import { QuerySchema } from '@core/schema/query.schema';
import { z } from 'zod';

export type Id = z.infer<typeof IdSchema>;
export type Query = z.infer<typeof QuerySchema>;
export type Email = z.infer<typeof EmailSchema>;
export type Password = z.infer<typeof PasswordSchema>;

export type Timestamp = z.infer<typeof TimestampSchema>;
export type Conditions = Record<string, any>;
