/*
 * Password Regex
 * Minimum eight (8) characters, at least
 * one (1) uppercase letter,
 * one (1) lowercase letter,
 * one (1) number and
 * one (1) special character [#?!@$%^&*-]
 */
export const PASSWORD_REGEX = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/;
