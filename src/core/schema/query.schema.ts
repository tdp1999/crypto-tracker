import { IdSchema } from '@core/schema/common.schema';
import { ORDER_TYPE } from '@shared/enums/order-type.enum';
import { z } from 'zod';

export const QuerySchema = z.object({
    // General search
    key: z.string().trim().optional(),

    // Pagination
    limit: z.coerce.number().min(1).optional(),
    page: z.coerce.number().min(1).optional(),

    // Sort
    orderBy: z.string().optional(),
    orderType: z.string().toLowerCase().pipe(z.nativeEnum(ORDER_TYPE)).optional(),
});

export type QueryDto = z.infer<typeof QuerySchema>;

export const DetailQuerySchema = z.object({ id: IdSchema });

export type DetailQueryDto = z.infer<typeof DetailQuerySchema>;
