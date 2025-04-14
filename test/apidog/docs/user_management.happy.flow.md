# Happy Flow: User Management Operations

This document outlines a successful flow for managing users, including listing, creating, updating, and deleting user records.

## Flow Steps

1. **Login as Admin User**

    - API: `POST /auth/login`
    - Request body:
        ```json
        {
            "email": "admin@example.com",
            "password": "AdminPass123!"
        }
        ```
    - Expected response: `201 Created`
    - Validation: Response contains `data.accessToken`
    - Save token: Store the access token for subsequent requests

2. **List Users with Pagination**

    - API: `GET /users?page=1&limit=10`
    - Headers: `Authorization: Bearer {access_token}`
    - Expected response: `200 OK`
    - Validation: Response contains paginated list of users with correct structure
    - Save data: Store the total count and first user ID for later use

3. **Create New User**

    - API: `POST /users`
    - Headers: `Authorization: Bearer {access_token}`
    - Request body:
        ```json
        {
            "email": "newuser@example.com",
            "password": "NewUserPass123!"
        }
        ```
    - Expected response: `201 Created`
    - Validation: Response contains the ID of the newly created user
    - Save data: Store the new user ID for subsequent operations

4. **Get User Details**

    - API: `GET /users/{user_id}`
    - Headers: `Authorization: Bearer {access_token}`
    - Expected response: `200 OK`
    - Validation: Response contains correct user information matching the created user

5. **Update User Information**

    - API: `PUT /users/{user_id}`
    - Headers: `Authorization: Bearer {access_token}`
    - Request body:
        ```json
        {
            "email": "updated-user@example.com"
        }
        ```
    - Expected response: `200 OK`
    - Validation: Response indicates successful update

6. **Verify Updated Information**

    - API: `GET /users/{user_id}`
    - Headers: `Authorization: Bearer {access_token}`
    - Expected response: `200 OK`
    - Validation: Response contains updated user information with the new email

7. **Delete User**

    - API: `DELETE /users/{user_id}`
    - Headers: `Authorization: Bearer {access_token}`
    - Expected response: `200 OK`
    - Validation: Response indicates successful deletion

8. **Verify User Deletion**
    - API: `GET /users/{user_id}`
    - Headers: `Authorization: Bearer {access_token}`
    - Expected response: `404 Not Found`
    - Validation: Response indicates user not found

## Test Assertions

- Admin login should succeed and return a valid access token
- User listing should return paginated results with correct structure
- User creation should succeed and return the new user ID
- User detail retrieval should return correct user information
- User update should succeed and reflect the changes in subsequent retrieval
- User deletion should succeed and make the resource unretrievable

## Notes

- This flow tests the complete CRUD operations for user management
- Admin permissions are required for these operations
- Variables like the access token and user IDs need to be stored and passed between requests
