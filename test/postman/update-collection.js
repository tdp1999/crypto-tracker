// @ts-nocheck
/**
 * This script combines individual module Postman specs into a single collection
 * Usage: node update-collection.js
 */

const fs = require('fs');
const path = require('path');

// Configuration
const POSTMAN_DIR = __dirname;
const MODULES_DIR = path.join(POSTMAN_DIR, 'modules');
const MAIN_COLLECTION = 'collection.json';
const MODULE_PATTERN = /^(.+)\.postman\.spec\.json$/;

// Load main collection
function loadMainCollection() {
    const filePath = path.join(POSTMAN_DIR, MAIN_COLLECTION);

    // Create a default collection if it doesn't exist
    if (!fs.existsSync(filePath)) {
        const defaultCollection = {
            info: {
                _postman_id: require('crypto').randomUUID(),
                name: 'Crypto Tracker',
                description: 'Complete collection for Crypto Tracker API',
                schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
            },
            item: [],
        };

        fs.writeFileSync(filePath, JSON.stringify(defaultCollection, null, 2));
        return defaultCollection;
    }

    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

// Load module file and validate it
function loadModule(fileName) {
    try {
        const filePath = path.join(MODULES_DIR, fileName);
        const moduleSpec = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const moduleName = moduleSpec.info.name;

        // Create folder structure with module requests
        return {
            name: moduleName,
            item: moduleSpec.item,
            description: moduleSpec.info.description || `${moduleName} API endpoint tests`,
        };
    } catch (error) {
        console.error(`Error loading module ${fileName}: ${error.message}`);
        return null;
    }
}

// Find all module specs and combine them
function updateCollection() {
    console.log('Starting collection update...');

    // Create modules directory if it doesn't exist
    if (!fs.existsSync(MODULES_DIR)) {
        fs.mkdirSync(MODULES_DIR, { recursive: true });
        console.log(`Created modules directory at ${MODULES_DIR}`);
    }

    const mainCollection = loadMainCollection();

    // Find all module files
    const files = fs.readdirSync(MODULES_DIR);
    const moduleFiles = files.filter((file) => MODULE_PATTERN.test(file));

    // Extract module names from files
    const moduleNames = new Set();
    const modules = [];

    // Load all valid modules
    for (const file of moduleFiles) {
        console.log(`Processing module file: ${file}`);
        const module = loadModule(file);
        if (!module) continue;

        moduleNames.add(module.name.toLowerCase());
        modules.push(module);
    }

    // Remove modules that no longer have spec files
    const updatedItems = [];
    let removedCount = 0;

    for (const item of mainCollection.item) {
        if (moduleNames.has(item.name.toLowerCase())) {
            // This module still exists, will be updated later
            updatedItems.push(item);
        } else {
            console.log(`Removing module: ${item.name} (spec file not found)`);
            removedCount++;
        }
    }

    // Replace with filtered list
    mainCollection.item = updatedItems;

    // Now update or add modules
    for (const module of modules) {
        const moduleLowerName = module.name.toLowerCase();
        const existingIndex = mainCollection.item.findIndex((item) => item.name.toLowerCase() === moduleLowerName);

        if (existingIndex >= 0) {
            // Update existing module
            mainCollection.item[existingIndex] = module;
            console.log(`Updated module: ${module.name}`);
        } else {
            // Add new module
            mainCollection.item.push(module);
            console.log(`Added new module: ${module.name}`);
        }
    }

    // Save updated collection
    fs.writeFileSync(path.join(POSTMAN_DIR, MAIN_COLLECTION), JSON.stringify(mainCollection, null, 2));

    console.log(`Collection updated: ${mainCollection.item.length} modules kept, ${removedCount} modules removed`);
}

// Run the update process
updateCollection();
