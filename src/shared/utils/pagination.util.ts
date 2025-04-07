import { PaginatedResponse, PaginationMeta } from '@shared/types/pagination.type';

export function paginate<T>(items: T[], totalItems: number, page: number, limit: number): PaginatedResponse<T> {
    const totalPages = Math.ceil(totalItems / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    const meta: PaginationMeta = {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage,
        hasPreviousPage,
    };

    return {
        data: items,
        meta,
    };
}
