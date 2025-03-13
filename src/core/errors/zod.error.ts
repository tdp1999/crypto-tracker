import { z } from 'zod';

export const globalErrorMap: z.ZodErrorMap = (issue, ctx) => {
    switch (issue.code) {
        case z.ZodIssueCode.invalid_type:
            return {
                message: `Expected type ${issue.expected}, but received ${issue.received}.`,
            };

        case z.ZodIssueCode.too_small:
            if (issue.type === 'array') {
                return {
                    message: `Array is too small. Minimum length is ${issue.minimum}.`,
                };
            }
            if (issue.type === 'string') {
                return {
                    message: `String is too short. Minimum length is ${issue.minimum} characters.`,
                };
            }
            return {
                message: `Value is too small. Minimum is ${issue.minimum}.`,
            };

        case z.ZodIssueCode.too_big:
            if (issue.type === 'array') {
                return {
                    message: `Array is too big. Maximum length is ${issue.maximum}.`,
                };
            }
            if (issue.type === 'string') {
                return {
                    message: `String is too long. Maximum length is ${issue.maximum} characters.`,
                };
            }
            return {
                message: `Value is too large. Maximum is ${issue.maximum}.`,
            };

        case z.ZodIssueCode.invalid_enum_value:
            return {
                message: `Invalid enum value. Expected one of: ${issue.options.join(', ')}.`,
            };

        case z.ZodIssueCode.custom:
            return {
                message: `Custom validation failed: ${issue.message}`,
            };

        default:
            return { message: ctx.defaultError };
    }
};
