/**
 * Combine Apidog Spec Files
 *
 * This script reads all *.apidog.spec.json files from the test/apidog/module directory
 * and combines them into a single collection file at test/apidog/collection.apidog.json.
 *
 * Enhancement: Only updates modules that have changed by comparing content hashes.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Configuration
const SOURCE_DIR = path.join(__dirname, '..', 'test', 'apidog', 'module');
const OUTPUT_FILE = path.join(__dirname, '..', 'test', 'apidog', 'collection.apidog.json');

// Ensure output directory exists
const outputDir = path.dirname(OUTPUT_FILE);
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Collection template for new collections
const newCollectionTemplate = {
    info: {
        name: 'Crypto Tracker API',
        description: 'API collection for Crypto Tracker application',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    },
    item: [],
    variable: [
        {
            key: 'baseUrl',
            value: 'http://localhost:3000',
            type: 'string',
        },
        {
            key: 'API_PREFIX',
            value: 'api',
            type: 'string',
        },
    ],
};

/**
 * Generate a hash from content to detect changes
 * @param {string} content - Content to hash
 * @return {string} - Hash of the content
 */
function generateContentHash(content) {
    return crypto.createHash('md5').update(content).digest('hex');
}

function processItemRecursively(item) {
    // Process request body if present
    if (item.request && item.request.body && item.request.body.mode === 'raw') {
        try {
            const bodyContent = item.request.body.raw.trim();
            if (bodyContent.startsWith('{') && bodyContent.endsWith('}')) {
                // Keep as raw but ensure options are set correctly
                item.request.body = {
                    mode: 'raw',
                    raw: bodyContent,
                    options: {
                        raw: {
                            language: 'json',
                        },
                    },
                };
            }
        } catch (error) {
            console.error(`Error processing body for item "${item.name}":`, error);
        }
    }

    // Process response bodies
    if (item.response && Array.isArray(item.response)) {
        item.response.forEach((response) => {
            if (
                response.originalRequest &&
                response.originalRequest.body &&
                response.originalRequest.body.mode === 'raw'
            ) {
                try {
                    const bodyContent = response.originalRequest.body.raw.trim();
                    if (bodyContent.startsWith('{') && bodyContent.endsWith('}')) {
                        // Keep as raw but ensure options are set correctly
                        response.originalRequest.body = {
                            mode: 'raw',
                            raw: bodyContent,
                            options: {
                                raw: {
                                    language: 'json',
                                },
                            },
                        };
                    }
                } catch (error) {
                    console.error(`Error processing response body for item "${item.name}":`, error);
                }
            }
        });
    }

    // Process nested items recursively
    if (item.item && Array.isArray(item.item)) {
        item.item.forEach((nestedItem) => processItemRecursively(nestedItem));
    }
}

/**
 * Extract the module core content (without metadata)
 * @param {Object} moduleSpec - Module specification
 * @return {Object} - Module without metadata
 */
function extractModuleCore(moduleSpec) {
    // Strip out any properties that start with underscore
    const core = { ...moduleSpec };

    // Remove metadata from the module
    if (core.info) {
        core.info = { ...core.info };
    }

    // The real content we care about is in the item array
    if (Array.isArray(core.item)) {
        core.item = core.item.map((item) => {
            const cleanItem = { ...item };
            // Remove any metadata properties
            Object.keys(cleanItem).forEach((key) => {
                if (key.startsWith('_')) {
                    delete cleanItem[key];
                }
            });

            // Process the item recursively
            processItemRecursively(cleanItem);

            return cleanItem;
        });
    }

    return core;
}

// Update the section in the script where modules are added to the collection
function convertJsonModeToRaw(collection) {
    // Handle request bodies at the collection level
    if (collection.request && collection.request.body && collection.request.body.mode === 'json') {
        const jsonBody = collection.request.body.json;
        collection.request.body = {
            mode: 'raw',
            raw: JSON.stringify(jsonBody, null, 2),
            options: {
                raw: {
                    language: 'json',
                },
            },
        };
    }

    // Handle request bodies in item array
    if (collection.item && Array.isArray(collection.item)) {
        collection.item.forEach((item) => convertJsonModeToRaw(item));
    }

    // Handle response bodies
    if (collection.response && Array.isArray(collection.response)) {
        collection.response.forEach((response) => {
            if (
                response.originalRequest &&
                response.originalRequest.body &&
                response.originalRequest.body.mode === 'json'
            ) {
                const jsonBody = response.originalRequest.body.json;
                response.originalRequest.body = {
                    mode: 'raw',
                    raw: JSON.stringify(jsonBody, null, 2),
                    options: {
                        raw: {
                            language: 'json',
                        },
                    },
                };
            }
        });
    }

    return collection;
}

// Main execution
console.log('Starting Apidog spec compilation...');

// Check for force flag
const forceUpdate = process.argv.includes('--force');
if (forceUpdate) {
    console.log('Force update flag detected. Will update collection regardless of content changes.');
}

try {
    // Find all spec files in the source directory
    const files = fs.readdirSync(SOURCE_DIR).filter((file) => file.endsWith('.apidog.spec.json'));

    if (files.length === 0) {
        console.error('No spec files found in', SOURCE_DIR);
        process.exit(1);
    }

    console.log(`Found ${files.length} spec files to process.`);

    // Initialize collection - either from existing file or template
    let collection;
    let existingModules = {};
    let hasChanges = forceUpdate; // If force flag is set, we'll always update

    // Check if output file already exists
    if (fs.existsSync(OUTPUT_FILE)) {
        try {
            const existingContent = fs.readFileSync(OUTPUT_FILE, 'utf8');
            const existingCollection = JSON.parse(existingContent);
            collection = existingCollection;

            // Create a map of existing modules by name for easy lookup
            if (collection.item && Array.isArray(collection.item)) {
                collection.item.forEach((moduleItem) => {
                    if (moduleItem.name) {
                        existingModules[moduleItem.name] = {
                            index: collection.item.indexOf(moduleItem),
                            hash: moduleItem._contentHash || '',
                            item: moduleItem,
                        };
                    }
                });
            }

            console.log(`Loaded existing collection with ${Object.keys(existingModules).length} modules.`);
        } catch (err) {
            console.warn(`Error reading existing collection: ${err.message}`);
            console.warn('Creating new collection from template.');
            collection = JSON.parse(JSON.stringify(newCollectionTemplate));
            hasChanges = true;
        }
    } else {
        console.log('Creating new collection from template.');
        collection = JSON.parse(JSON.stringify(newCollectionTemplate));
        hasChanges = true;
    }

    // Keep track of processed modules to detect removals
    const processedModules = new Set();
    const addedModules = [];
    const updatedModules = [];
    const removedModules = [];

    // Process each spec file
    files.forEach((file) => {
        const filePath = path.join(SOURCE_DIR, file);
        console.log(`Processing ${file}...`);

        try {
            const specFile = require(filePath);

            // Extract the module name, items and modify them for the collection
            const moduleName = specFile.info.name.trim();
            processedModules.add(moduleName);
            const coreContent = extractModuleCore(specFile);

            // Calculate hash of the module's actual content
            const contentHash = generateContentHash(JSON.stringify(coreContent));

            // Check if this module exists and has the same hash
            if (!forceUpdate && existingModules[moduleName] && existingModules[moduleName].hash === contentHash) {
                console.log(`Module "${moduleName}" has not changed. Skipping.`);
                return; // Skip this module as it hasn't changed
            }

            // If we got here, the module has changed or is new
            hasChanges = true;

            // Create or update the module item
            const moduleItem = {
                name: moduleName,
                description: specFile.info.description || '',
                item: specFile.item || [],
                _contentHash: contentHash, // Store the content hash for future comparison
            };

            // Add or update the module in the collection
            if (existingModules[moduleName]) {
                console.log(`Updating existing module "${moduleName}" (content has changed).`);
                collection.item[existingModules[moduleName].index] = moduleItem;
                updatedModules.push(moduleName);
            } else {
                console.log(`Adding new module "${moduleName}".`);
                collection.item.push(moduleItem);
                addedModules.push(moduleName);
            }

            // Convert all json mode items to raw
            convertJsonModeToRaw(moduleItem);
        } catch (err) {
            console.error(`Error processing ${file}:`, err.message);
        }
    });

    // Remove modules that no longer exist in the source directory
    if (collection.item) {
        const initialLength = collection.item.length;
        collection.item = collection.item.filter((moduleItem) => {
            if (!processedModules.has(moduleItem.name)) {
                console.log(`Removing module "${moduleItem.name}" that no longer exists.`);
                hasChanges = true;
                removedModules.push(moduleItem.name);
                return false;
            }
            return true;
        });

        if (initialLength !== collection.item.length) {
            console.log(`Removed ${initialLength - collection.item.length} module(s) that no longer exist.`);
        }
    }

    // Only write to the output file if there were changes
    if (hasChanges) {
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(collection, null, 2));
        console.log(`Successfully updated combined collection at ${OUTPUT_FILE}`);
    } else {
        console.log('No changes detected. Collection file remains unchanged.');
    }

    // Print a summary
    console.log('\nSummary:');
    console.log(`- Collection modules: ${collection.item.length}`);
    console.log(`- Processed files: ${files.length}`);
    console.log(`- Changes detected: ${hasChanges ? 'Yes' : 'No'}`);

    if (hasChanges) {
        console.log('\nChanges:');
        if (addedModules.length > 0) {
            console.log(`- Added: ${addedModules.join(', ')}`);
        }
        if (updatedModules.length > 0) {
            console.log(`- Updated: ${updatedModules.join(', ')}`);
        }
        if (removedModules.length > 0) {
            console.log(`- Removed: ${removedModules.join(', ')}`);
        }
    }
} catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
}
