# Failure Flow: Provider Operations with Invalid Parameters

This document outlines failure scenarios when using the cryptocurrency provider API with invalid parameters or without proper authentication.

## Flow Steps

1. **Login to Get Access Token**

    - API: `POST /auth/login`
    - Request body:
        ```json
        {
            "email": "user@example.com",
            "password": "SecurePassword123!"
        }
        ```
    - Expected response: `201 Created`
    - Save token: Store the access token for some of the subsequent requests

2. **Search with Empty Key**

    - API: `GET /provider/search?key=`
    - Headers: `Authorization: Bearer {access_token}`
    - Expected response: `400 Bad Request`
    - Validation: Response includes error about missing or invalid key parameter

3. **Search with Too Short Key**

    - API: `GET /provider/search?key=a`
    - Headers: `Authorization: Bearer {access_token}`
    - Expected response: `400 Bad Request`
    - Validation: Response includes error about key length or format

4. **Access Provider without Authentication**

    - API: `GET /provider/search?key=bitcoin`
    - Headers: No Authorization header
    - Expected response: `401 Unauthorized`
    - Validation: Response includes error about missing authentication

5. **Get Price with Empty IDs**

    - API: `GET /provider/price?ids=`
    - Headers: `Authorization: Bearer {access_token}`
    - Expected response: `400 Bad Request`
    - Validation: Response includes error about missing or invalid ids parameter

6. **Get Price with Invalid IDs Format**

    - API: `GET /provider/price?ids=,,,`
    - Headers: `Authorization: Bearer {access_token}`
    - Expected response: `400 Bad Request`
    - Validation: Response includes error about invalid ids format

7. **Get Price with Non-existent Cryptocurrency**
    - API: `GET /provider/price?ids=non-existent-crypto`
    - Headers: `Authorization: Bearer {access_token}`
    - Expected response: Either `404 Not Found` or `200 OK` with empty data
    - Validation: Response indicates the cryptocurrency was not found or returns empty data

## Test Assertions

- Search endpoint should reject requests with empty or missing key parameter
- Search endpoint should enforce minimum key length/format requirements
- Provider endpoints should reject unauthorized requests
- Price endpoint should reject requests with empty or missing ids parameter
- Price endpoint should validate the format of ids parameter
- Price endpoint should handle non-existent cryptocurrencies gracefully

## Notes

- This flow tests input validation and error handling for the provider API
- Error responses should be informative and consistent
- Some provider-specific errors may be dependent on the external service's behavior
