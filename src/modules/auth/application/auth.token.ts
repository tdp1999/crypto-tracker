export const AUTH_TOKEN = {
    JWT_SERVICE: Symbol('AUTH.JWT_SERVICE'),
    REPOSITORY: Symbol('AUTH.REPOSITORY'),
    HANDLERS: {
        QUERY: {
            ME: Symbol('AUTH.QUERY.ME'),
        },
        COMMAND: {
            REGISTER: Symbol('AUTH.COMMAND.REGISTER'),
            LOGIN: Symbol('AUTH.COMMAND.LOGIN'),
            LOGOUT: Symbol('AUTH.COMMAND.LOGOUT'),
        },
    },
};
