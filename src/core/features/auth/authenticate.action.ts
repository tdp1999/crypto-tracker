export enum AuthenticateAction {
    VERIFY = 'auth.verify',
}

export enum AuthenticateUserAction {
    // Guard
    VALIDATE = 'auth_user.validate',
    VALIDATE_CREDENTIAL = 'auth_user.validate_credential',
    GET = 'auth_user.get',

    // Auth
    CREATE = 'auth_user.create',
    GET_PASSWORD = 'auth_user.get_password',
    GET_BY_EMAIL = 'auth_user.get_by_email',
    CHANGE_PASSWORD = 'auth_user.change_password',
}
