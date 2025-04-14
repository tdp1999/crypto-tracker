# API Test Generation Plan

This document outlines the plan for generating API test scenarios and specifications for the Crypto Tracker project, focusing on Apidog/Postman compatibility.

## Phase 1: Planning (This Document)

1.  **Goal:** Define the steps and methodology for generating test assets based on user requirements.
2.  **Output:** This file (`memory/apidog_1.memory.md`).

## Phase 2: Generation (Requires User Approval)

1.  **List Modules:** Identify all feature modules within the `src/modules` directory.
    - **Tool:** `list_dir`
2.  **Analyze Endpoints:** For each module:
    - Locate controller files (e.g., `*.controller.ts`).
    - Parse controllers to identify API endpoints (routes, methods, DTOs, guards).
    - **Tools:** `grep_search`, `read_file`
3.  **Generate Flow Scenario Documents:**
    - Based on analyzed endpoints, define key user flows (e.g., register -> login -> use feature -> logout).
    - Create descriptively named Markdown files in `test/apidog/docs/` using the naming pattern: `<action>_<action>_<action>.<result>.flow.md`
        - Example: `register_login_use_logout.happy.flow.md` for a successful user journey
        - Example: `register_login_invalid_credentials.failure.flow.md` for a failure scenario
    - Each flow document will detail the sequence of API calls, expected behaviors, and test assertions.
    - **Tool:** `edit_file`
4.  **Generate Individual Module Spec Files:**
    - For each module, create a `*.apidog.spec.json` file in `test/apidog/module/`.
    - Structure each file according to the Postman collection format v2.1.0, following the example from `test/postman/result/Crypto Tracker.postman.json`.
    - For each API endpoint, include both success and failure cases as items within the endpoint's `response` array (not as separate endpoints).
    - Leverage Postman/Apidog features like collection variables for dynamic data (e.g., auth tokens, generated IDs).
    - **Tool:** `edit_file` (for each module spec)
5.  **Add Collection Merging Script to `package.json`:**
    - Add a new script to `package.json` (e.g., `"apidog:update"`).
    - This script will execute a helper Node.js script (`scripts/combine-apidog-specs.js`) responsible for:
        - Reading all `*.apidog.spec.json` files from `test/apidog/module/`.
        - Merging the `item` arrays from each file into a single collection JSON.
        - Defining a basic collection `info` block.
        - Writing the combined collection to `test/apidog/collection.apidog.json`.
    - Generate the `scripts/combine-apidog-specs.js` helper script.
    - **Tools:** `edit_file` (for `package.json` and `scripts/combine-apidog-specs.js`)

## Planned Folder Structure

```
crypto-tracker
├── src/
│   └── modules/            # Existing modules folder
├── test/
│   └── apidog/             # Root folder for Apidog tests
│       ├── docs/           # Documentation for test flows
│       │   ├── register_login_use_logout.happy.flow.md
│       │   ├── register_invalid_data.failure.flow.md
│       │   ├── login_invalid_credentials.failure.flow.md
│       │   └── [other flow documents...]
│       ├── module/         # Individual module spec files
│       │   ├── auth.apidog.spec.json
│       │   ├── user.apidog.spec.json
│       │   ├── asset.apidog.spec.json
│       │   └── provider.apidog.spec.json
│       └── collection.apidog.json  # Combined collection file (generated)
└── scripts/
    └── combine-apidog-specs.js     # Helper script for combining spec files
```

## Next Steps

Please review this updated plan. Once you approve, I will proceed with Phase 2, starting with identifying modules and analyzing endpoints.
