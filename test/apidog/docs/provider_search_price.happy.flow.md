# Happy Flow: Cryptocurrency Provider Operations

This document outlines a successful flow for using the cryptocurrency provider API to check service health, search for cryptos, and retrieve price information.

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
    - Validation: Response contains `data.accessToken`
    - Save token: Store the access token for subsequent requests

2. **Check Provider Health**

    - API: `GET /provider/ping`
    - Headers: `Authorization: Bearer {access_token}`
    - Expected response: `200 OK`
    - Validation: Response indicates the provider service is operational

3. **Search for a Popular Cryptocurrency**

    - API: `GET /provider/search?key=bitcoin`
    - Headers: `Authorization: Bearer {access_token}`
    - Expected response: `200 OK`
    - Validation: Response contains search results for Bitcoin
    - Save data: Store the ID (e.g., 'bitcoin') for the next request

4. **Search for Multiple Cryptocurrencies**

    - API: `GET /provider/search?key=eth`
    - Headers: `Authorization: Bearer {access_token}`
    - Expected response: `200 OK`
    - Validation: Response contains search results for Ethereum-related cryptocurrencies
    - Save data: Store one or more additional IDs (e.g., 'ethereum')

5. **Get Price for a Single Cryptocurrency**

    - API: `GET /provider/price?ids=bitcoin`
    - Headers: `Authorization: Bearer {access_token}`
    - Expected response: `200 OK`
    - Validation: Response contains price information for Bitcoin

6. **Get Prices for Multiple Cryptocurrencies**
    - API: `GET /provider/price?ids=bitcoin,ethereum`
    - Headers: `Authorization: Bearer {access_token}`
    - Expected response: `200 OK`
    - Validation: Response contains price information for both Bitcoin and Ethereum

## Test Assertions

- Login should succeed and return a valid access token
- Provider health check should confirm the service is working
- Search endpoint should return relevant results for popular cryptocurrencies
- Search endpoint should work with partial terms and return multiple matches when appropriate
- Price endpoint should return valid price data for a single cryptocurrency
- Price endpoint should return valid price data for multiple cryptocurrencies

## Notes

- This flow tests the core cryptocurrency provider functionality
- The external provider (e.g., CoinGecko) must be available for these tests to pass
- Price data is volatile and will change between test runs
