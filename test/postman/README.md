# Crypto Tracker Postman Tests

This directory contains Postman test files for the Crypto Tracker API.

## Modular Approach

We use a modular approach to organize Postman tests by API module:

1. Each API module has its own spec file in the `modules/` directory (e.g., `modules/provider.postman.spec.json`)
2. A master collection (`collection.json`) combines all modules
3. A utility script (`update-collection.js`) automates syncing changes

## File Structure

- `modules/*.postman.spec.json` - Individual module specs
- `collection.json` - Combined collection for Postman
- `update-collection.js` - Script to combine modules into the collection

## How to Add a New Module

1. Create a new file named `<module-name>.postman.spec.json` in the `modules/` directory
2. Follow the naming conventions in the postman-test.mdc rule
3. Run the update script to add it to the main collection:
    ```
    npm run postman:update
    ```

## How to Update an Existing Module

1. Make changes to the module's spec file (e.g., `modules/provider.postman.spec.json`)
2. Run the update script to sync changes to the main collection:
    ```
    npm run postman:update
    ```
3. Import the updated main collection into Postman

## Importing to Postman

You have two options for working with these files in Postman:

### Option 1: Import the Master Collection (Recommended)

Import `collection.json` to get all modules in a single collection.

### Option 2: Import Individual Modules

Import specific module files from the `modules` directory if you only need to work with certain parts of the API.

## Integrating with Your API in Postman

1. Import the collection in Postman
2. Create or select your API in Postman
3. Link the collection to your API by clicking "Add Collection"
4. Select the imported collection from the dropdown

This approach allows you to maintain module-specific files for version control while presenting a unified collection in Postman.
