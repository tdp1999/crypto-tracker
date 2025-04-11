export const USER_TOKENS = {
    REPOSITORIES: Symbol('USER.REPOSITORY'),

    HANDLERS: {
        QUERY: {
            LIST: Symbol('USER.QUERY.LIST'),
            DETAIL: Symbol('USER.QUERY.DETAIL'),
            GET_BY_CONDITION: Symbol('USER.QUERY.GET_BY_CONDITION'),
        },
        COMMAND: {
            CREATE: Symbol('USER.COMMAND.CREATE'),
            UPDATE: Symbol('USER.COMMAND.UPDATE'),
            DELETE: Symbol('USER.COMMAND.DELETE'),
        },
    },

    ADAPTERS: {
        CONFIG: Symbol('USER.ADAPTER.CONFIG'),
    },
};
