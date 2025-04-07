import { z, ZodRawShape } from 'zod';
import { QuerySchema } from '../schema/query.schema';

/** Represents the 'select all' columns option */
// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
export const SELECT_ALL_COLUMNS = '*' as const; // Define constant for clarity

/**
 * Creates a Zod schema for query parameters, incorporating base query options,
 * entity-specific sorting/projection, and optional custom filter fields.
 *
 * @param allowedKeys A readonly array of valid key strings for the entity (for orderBy, visibleColumns).
 * @param filterShape A Zod shape object (e.g., from `EntitySchema.pick({...}).shape`) containing
 *                    the fields to be used for filtering. These will be made optional.
 * @returns A Zod schema for querying the specific entity.
 */
export function createEntityQuerySchema<
    K extends string,
    // Ensure FilterShape is an object where values are Zod types
    FilterShape extends ZodRawShape,
>(
    allowedKeys: readonly K[],
    // Pass the shape directly ({ fieldName: ZodType, ... })
    filterShape: FilterShape,
) {
    if (!allowedKeys || allowedKeys.length === 0) {
        throw new Error('At least one allowed key must be provided for createEntityQuerySchema.');
    }

    // --- Schemas for orderBy and visibleColumns ---
    const KeysEnum = z.enum(allowedKeys as unknown as readonly [string, ...string[]]);
    const SpecificColumnsSchema = z.array(KeysEnum);
    const AllColumnsSchema = z.literal(SELECT_ALL_COLUMNS);

    // --- Schema for the optional custom filter fields ---
    // 1. Create a Zod object from the passed shape
    // 2. Make all fields in this object optional (since they are query params)
    const PartialFilterSchema = z.object(filterShape).partial();

    // --- Combine everything ---
    return QuerySchema.extend({
        orderBy: KeysEnum.optional(),

        // visibleColumns can now be EITHER an array of keys OR the '*' string
        visibleColumns: z
            .union([SpecificColumnsSchema, AllColumnsSchema])
            .optional()
            .describe(`Specify which columns to include, or use '${SELECT_ALL_COLUMNS}' for all columns`),

        // Add the optional filter fields by spreading the shape
        // of the PartialFilterSchema
        ...PartialFilterSchema.shape,
    });
}

// Example Usage remains similar:

// Assuming User entity keys
// const userKeys = ['id', 'name', 'email', 'createdAt'] as const;

// Generate the specific schema
// const UserQuerySchema = createEntityQuerySchema(userKeys, UserSchema.pick({ email: true, status: true }).shape);

// Infer the type
// export type UserQueryDto = z.infer<typeof UserQuerySchema>;

/*
Now UserQueryDto type will be:
{
    key?: string | undefined;
    limit?: number | undefined;
    page?: number | undefined;
    orderBy?: "id" | "name" | "email" | "createdAt" | undefined;
    orderType?: ORDER_TYPE | undefined;
    // visibleColumns is now a union type!
    visibleColumns?: ("id" | "name" | "email" | "createdAt")[] | "*" | undefined;
    // --- Added custom filter fields (now optional) ---
    email?: string | undefined;
    status?: "ACTIVE" | "INACTIVE" | undefined;
}
*/
