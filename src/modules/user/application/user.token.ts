export const USER_TOKENS = {
    REPOSITORIES: Symbol('USER.REPOSITORY'),

    HANDLERS: {
        QUERY: {
            LIST: Symbol('USER.QUERY.LIST'),
            DETAIL: Symbol('USER.QUERY.DETAIL'),
        },
        COMMAND: {
            CREATE: Symbol('USER.COMMAND.CREATE'),
            UPDATE: Symbol('USER.COMMAND.UPDATE'),
            DELETE: Symbol('USER.COMMAND.DELETE'),
        },
    },
};
