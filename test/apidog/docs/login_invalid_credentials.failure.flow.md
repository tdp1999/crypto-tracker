# Failure Flow: Login with Invalid Credentials

This document outlines failure scenarios when attempting to log in with invalid credentials or trying to access protected resources without proper authentication.

## Flow Steps

1. **Attempt Login with Invalid Email Format**

    - API: `POST /auth/login`
    - Request body:
        ```json
        {
            "email": "invalid-email",
            "password": "Password123!"
        }
        ```
    - Expected response: `400 Bad Request`
    - Validation: Response includes validation error for email format

2. **Attempt Login with Non-existent User**

    - API: `POST /auth/login`
    - Request body:
        ```json
        {
            "email": "nonexistent@example.com",
            "password": "Password123!"
        }
        ```
    - Expected response: `401 Unauthorized`
    - Validation: Response includes appropriate error message about invalid credentials

3. **Attempt Login with Incorrect Password**

    - API: `POST /auth/login`
    - Request body:
        ```json
        {
            "email": "existing@example.com",
            "password": "WrongPassword123!"
        }
        ```
    - Expected response: `401 Unauthorized`
    - Validation: Response includes appropriate error message about invalid credentials

4. **Access Protected Endpoint without Authentication**

    - API: `GET /auth/me`
    - Headers: No Authorization header
    - Expected response: `401 Unauthorized`
    - Validation: Response includes error message about missing authentication

5. **Access Protected Endpoint with Invalid Token**
    - API: `GET /auth/me`
    - Headers: `Authorization: Bearer invalid.token.here`
    - Expected response: `401 Unauthorized`
    - Validation: Response includes error message about invalid token

## Test Assertions

- Login should fail with proper error messages when invalid email format is provided
- Login should fail with proper error messages when non-existent user attempts to login
- Login should fail with proper error messages when incorrect password is provided
- Protected endpoints should reject requests without authentication
- Protected endpoints should reject requests with invalid authentication tokens

## Notes

- This flow tests the authentication error handling of the application
- Error responses should be informative but not reveal sensitive information
- The application should maintain proper security by denying access to unauthorized requests
