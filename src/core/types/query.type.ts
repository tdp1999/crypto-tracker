import { z } from 'zod';
import { DetailQuerySchema } from '../schema/query.schema';

export type DetailQueryDto = z.infer<typeof DetailQuerySchema>;

export type FindByIdsResult<T, Id> = { found: T[]; notFound: Id[] };
