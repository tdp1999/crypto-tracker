# Happy Flow: Register User, Login, and Search for Crypto

This document outlines a complete successful flow for a user registering to the system, logging in, and using the platform to search for cryptocurrency information.

## Flow Steps

1. **Register New User**

    - API: `POST /auth/register`
    - Request body:
        ```json
        {
            "email": "user@example.com",
            "password": "SecurePassword123!"
        }
        ```
    - Expected response: `201 Created`
    - Save result: User is registered

2. **Login with Credentials**

    - API: `POST /auth/login`
    - Request body:
        ```json
        {
            "email": "user@example.com",
            "password": "SecurePassword123!"
        }
        ```
    - Expected response: `201 Created`
    - Validation: Response contains `data.accessToken`
    - Save token: Store the access token for subsequent requests

3. **Get User Profile**

    - API: `GET /auth/me`
    - Headers: `Authorization: Bearer {access_token}`
    - Expected response: `200 OK`
    - Validation: Response contains user information matching the registered email

4. **Search for Cryptocurrency**

    - API: `GET /provider/search?key={search_term}`
    - Headers: `Authorization: Bearer {access_token}`
    - Example: `GET /provider/search?key=bitcoin`
    - Expected response: `200 OK`
    - Validation: Response contains cryptocurrency results matching the search term

5. **Get Cryptocurrency Price**
    - API: `GET /provider/price?ids={crypto_ids}`
    - Headers: `Authorization: Bearer {access_token}`
    - Example: `GET /provider/price?ids=bitcoin,ethereum`
    - Expected response: `200 OK`
    - Validation: Response contains price information for the requested cryptocurrencies

## Test Assertions

- User registration should succeed with valid credentials
- Login should succeed with valid credentials and return an access token
- The me endpoint should return the correct user information
- Search endpoint should return relevant cryptocurrency results
- Price endpoint should return valid price data for requested cryptocurrencies

## Notes

- This flow tests the core functionality of the Crypto Tracker application
- Variables like the access token need to be stored and passed between requests
- The flow assumes the external price provider (Coingecko) is available and functioning
