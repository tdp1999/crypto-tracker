export const ASSET_TOKENS = {
    REPOSITORIES: {
        ASSET: Symbol('ASSET.REPOSITORY.ASSET'),
        FINANCIAL_GOAL: Symbol('ASSET.REPOSITORY.FINANCIAL_GOAL'),
    },
    HANDLERS: {
        QUERY: {
            LIST_DASHBOARD: Symbol('ASSET.QUERY.LIST_DASHBOARD'),
        },
        COMMAND: {
            CREATE: Symbol('ASSET.COMMAND.CREATE'),
            UPDATE: Symbol('ASSET.COMMAND.UPDATE'),
            DELETE: Symbol('ASSET.COMMAND.DELETE'),
        },
    },
};
