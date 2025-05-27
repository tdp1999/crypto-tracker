export const PORTFOLIO_TOKENS = {
    REPOSITORIES: Symbol('PORTFOLIO.REPOSITORY'),

    HANDLERS: {
        QUERY: {
            LIST: Symbol('PORTFOLIO.QUERY.LIST'),
            DETAIL: Symbol('PORTFOLIO.QUERY.DETAIL'),
            OWNERSHIP: Symbol('PORTFOLIO.QUERY.OWNERSHIP'),
        },
        COMMAND: {
            CREATE: Symbol('PORTFOLIO.COMMAND.CREATE'),
            UPDATE: Symbol('PORTFOLIO.COMMAND.UPDATE'),
            DELETE: Symbol('PORTFOLIO.COMMAND.DELETE'),
        },
    },
};
