import { BaseModel } from '@core/abstractions/model.base';
import { BadRequestError } from '@core/errors/domain.error';
import { ERR_COMMON_EMPTY_PAYLOAD } from '@core/errors/messages/common.error';
import { ErrorLayer } from '@core/errors/types/error-layer.type.error';
import { AuditableSchema } from '@core/schema/auditable.schema';
import { IdSchema } from '@core/schema/common.schema';
import { Id } from '@core/types/common.type';
import { IdentifierValue } from '@shared/vos/identifier.value';
import { z } from 'zod';

export const PortfolioSchema = z.object({
    id: IdSchema,
    name: z.string().min(1).max(255),
    description: z.string().max(1000).optional(),
    userId: IdSchema,
    isDefault: z.boolean().default(false),
    ...AuditableSchema.shape,
});

export const PortfolioCreateSchema = PortfolioSchema.pick({
    name: true,
    description: true,
    isDefault: true,
});

export const PortfolioUpdateSchema = PortfolioSchema.omit({ id: true, userId: true })
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
        message: ERR_COMMON_EMPTY_PAYLOAD,
    });

export type IPortfolio = z.infer<typeof PortfolioSchema>;

export class Portfolio extends BaseModel implements IPortfolio {
    readonly name: string;
    readonly description?: string;
    readonly userId: Id;
    readonly isDefault: boolean;

    private constructor(props: Partial<IPortfolio>) {
        super(props);
        Object.assign(this, props);
    }

    static create(raw: Partial<IPortfolio>, userId: Id, createdById: Id): Portfolio {
        const { success, data, error } = PortfolioCreateSchema.safeParse(raw);
        if (!success) throw BadRequestError(error, { layer: ErrorLayer.DOMAIN, remarks: 'Portfolio creation failed' });

        return new Portfolio({
            ...data,
            userId,
            id: IdentifierValue.v7(),
            createdById,
            updatedById: createdById,
        });
    }

    static update(existing: IPortfolio, raw: Partial<IPortfolio>, updatedById: Id): Portfolio {
        const newData = { ...existing, ...raw, updatedById };
        const { success, error } = PortfolioUpdateSchema.safeParse(raw);
        if (!success) throw BadRequestError(error, { layer: ErrorLayer.DOMAIN, remarks: 'Portfolio update failed' });

        return new Portfolio(newData);
    }

    static fromPersistence(raw: IPortfolio): Portfolio {
        return new Portfolio(raw);
    }
}
