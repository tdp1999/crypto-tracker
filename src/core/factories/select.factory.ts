import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import { SELECT_ALL_COLUMNS } from './query.factory'; // Updated import path
import { NilValue } from '@shared/vos/nil.value';

/**
 * Applies the select clause based on visibleColumns DTO property.
 *
 * @param qb The SelectQueryBuilder instance.
 * @param alias The alias used for the main entity in the query builder.
 * @param visibleColumns The value from the query DTO (string array, '*' or nil).
 * @returns The modified SelectQueryBuilder.
 */
export function applySelectClause<Entity extends ObjectLiteral, K extends keyof Entity>(
    qb: SelectQueryBuilder<Entity>,
    alias: string,
    visibleColumns?: K[] | typeof SELECT_ALL_COLUMNS | null | string[],
): SelectQueryBuilder<Entity> {
    // If nil or '*', assume default selection (usually all columns) or keep existing selection
    if (NilValue.isNil(visibleColumns) || visibleColumns === SELECT_ALL_COLUMNS) {
        return qb; // No change needed
    }

    // If it's an array of specific columns
    if (Array.isArray(visibleColumns) && visibleColumns.length > 0) {
        // Map columns to 'alias.columnName' format
        const qualifiedColumns = visibleColumns.map((col) => `${alias}.${String(col)}`);
        qb.select(qualifiedColumns);
    }

    // If it's an empty array, we might want to consider the desired behavior.
    // Currently, it leaves the selection unchanged if the array is empty.
    return qb;
}

// --- How you'd use it in a service/repository ---
/*
async someMethod(queryDto: UserQueryDto): Promise<User[]> {
    const alias = 'user';
    let qb = this.repository.createQueryBuilder(alias);

    // ... apply where clauses using WhereBuilder ...
    qb = whereBuilder.build();

    // Apply selection
    qb = applySelect(qb, alias, queryDto.visibleColumns);

    // ... apply pagination, ordering etc. ...

    return qb.getMany();
}
*/
