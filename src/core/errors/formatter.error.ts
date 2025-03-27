import { ZodError } from 'zod';

/*
 * Customized zod error flattener, because zod cannot flat nested errors
 * */
export function customFlatten(error: ZodError) {
    const fieldErrors: Record<string, string[]> = {};

    for (const issue of error.errors) {
        const path = issue.path.join('.');
        if (!fieldErrors[path]) {
            fieldErrors[path] = [];
        }
        fieldErrors[path].push(issue.message);
    }

    return {
        formErrors: [],
        fieldErrors,
    };
}

export function formatZodError(error: ZodError) {
    const flattenedErrors = customFlatten(error);

    if (flattenedErrors.formErrors && flattenedErrors.formErrors.length > 0) {
        return { formErrors: flattenedErrors.formErrors };
    }

    return { ...flattenedErrors.fieldErrors };
}
