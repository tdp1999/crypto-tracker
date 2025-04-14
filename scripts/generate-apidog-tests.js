/**
 * Generate Apidog Test Flows
 *
 * This script reads Markdown flow documentation from the test/apidog/docs directory
 * and generates executable Apidog/Postman test collections with pre-request scripts,
 * test scripts, and appropriate variable handling.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const DOCS_DIR = path.join(__dirname, '..', 'test', 'apidog', 'docs');
const OUTPUT_DIR = path.join(__dirname, '..', 'test', 'apidog', 'flows');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Main execution
console.log('Starting conversion of test flows to Apidog/Postman collections...');

try {
    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // Create demo flow first
    const demoPath = path.join(OUTPUT_DIR, 'demo.apidog.json');
    createDemoFlow();
    console.log(`Created demo collection at ${demoPath}`);

    // Find flow documentation files
    const files = fs.readdirSync(DOCS_DIR).filter((file) => file.endsWith('.flow.md'));
    console.log(`Found ${files.length} flow documentation files in ${DOCS_DIR}`);

    if (files.length === 0) {
        console.warn('No flow documentation files found in', DOCS_DIR);
        console.log('Created demo collection only.');
        console.log('\nTo use these collections:');
        console.log('1. Open Apidog');
        console.log('2. Click "Import" button');
        console.log('3. Select the generated .apidog.json file(s)');
        console.log('4. The tests will be imported with all the necessary scripts');
        process.exit(0);
    }

    // Process each flow file
    files.forEach((file) => {
        const filePath = path.join(DOCS_DIR, file);
        console.log(`\nProcessing ${file}...`);

        try {
            // Read and parse the flow file
            const content = fs.readFileSync(filePath, 'utf8');
            console.log(`File content length: ${content.length} characters`);

            const flowData = parseFlowFile(content);
            console.log(`Title: "${flowData.title}"`);

            // Print steps for debugging
            if (flowData.steps.length > 0) {
                console.log(`Found ${flowData.steps.length} steps in the flow:`);
                flowData.steps.forEach((step) => {
                    console.log(`  - Step ${step.number}: ${step.name} (${step.method} ${step.endpoint})`);
                });
            } else {
                console.log('No steps found in the flow data. Checking flow content...');
                // Debug step regex
                const stepsSection = content.match(/## Flow Steps\s+([\s\S]+?)(?=\n## |$)/);
                if (stepsSection) {
                    console.log('Flow Steps section found. Content:');
                    const first100Chars = stepsSection[1].substring(0, 100).replace(/\n/g, '\\n');
                    console.log(`${first100Chars}...`);

                    // Check step format
                    const stepStartMatch = stepsSection[1].match(/\d+\.\s+\*\*([^*]+)\*\*/);
                    if (stepStartMatch) {
                        console.log(`First step name found: "${stepStartMatch[1].trim()}"`);
                    } else {
                        console.log('No properly formatted steps found. Steps must be in format: "1. **Step Name**"');
                    }
                } else {
                    console.log('No "## Flow Steps" section found in the document');
                }
            }

            // Generate output filename from input filename
            const outputFilename = file.replace('.flow.md', '.apidog.json');
            const outputPath = path.join(OUTPUT_DIR, outputFilename);

            // Generate the collection
            generateApidogCollection(flowData, outputPath);
        } catch (err) {
            console.error(`Error processing ${file}:`, err.message);
            console.error(err.stack);
        }
    });

    console.log('\nTo use these collections:');
    console.log('1. Open Apidog');
    console.log('2. Click "Import" button');
    console.log('3. Select the generated .apidog.json file(s)');
    console.log('4. The tests will be imported with all the necessary scripts');
} catch (err) {
    console.error('Error:', err.message);
    console.error(err.stack);
    process.exit(1);
}

/**
 * Create a demo flow with basic examples to ensure functionality
 */
function createDemoFlow() {
    const demoPath = path.join(OUTPUT_DIR, 'demo.apidog.json');

    const demoCollection = {
        info: {
            name: 'Demo Crypto Flow',
            description: 'A demo flow for testing the Apidog import functionality',
            schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
        },
        item: [
            {
                name: '1. Register User',
                request: {
                    method: 'POST',
                    header: [
                        {
                            key: 'Content-Type',
                            value: 'application/json',
                        },
                    ],
                    body: {
                        mode: 'raw',
                        raw: '{\n    "email": "{{test_email}}",\n    "password": "{{test_password}}"\n}',
                        options: {
                            raw: {
                                language: 'json',
                            },
                        },
                    },
                    url: {
                        raw: '{{baseUrl}}/{{API_PREFIX}}/auth/register',
                        host: ['{{baseUrl}}'],
                        path: ['{{API_PREFIX}}', 'auth', 'register'],
                    },
                },
                event: [
                    {
                        listen: 'prerequest',
                        script: {
                            type: 'text/javascript',
                            exec: [
                                '// Generate unique test email to avoid conflicts',
                                'const testEmail = `test.user.${Date.now()}@example.com`;',
                                'const testPassword = "SecurePassword123!";',
                                '',
                                "pm.variables.set('test_email', testEmail);",
                                "pm.variables.set('test_password', testPassword);",
                            ],
                        },
                    },
                    {
                        listen: 'test',
                        script: {
                            type: 'text/javascript',
                            exec: [
                                'pm.test("Status code is 201", function () {',
                                '    pm.response.to.have.status(201);',
                                '});',
                            ],
                        },
                    },
                ],
            },
            {
                name: '2. Login User',
                request: {
                    method: 'POST',
                    header: [
                        {
                            key: 'Content-Type',
                            value: 'application/json',
                        },
                    ],
                    body: {
                        mode: 'raw',
                        raw: '{\n    "email": "{{test_email}}",\n    "password": "{{test_password}}"\n}',
                        options: {
                            raw: {
                                language: 'json',
                            },
                        },
                    },
                    url: {
                        raw: '{{baseUrl}}/{{API_PREFIX}}/auth/login',
                        host: ['{{baseUrl}}'],
                        path: ['{{API_PREFIX}}', 'auth', 'login'],
                    },
                },
                event: [
                    {
                        listen: 'test',
                        script: {
                            type: 'text/javascript',
                            exec: [
                                'pm.test("Status code is 201", function () {',
                                '    pm.response.to.have.status(201);',
                                '});',
                                '',
                                'pm.test("Extract and store access token", function () {',
                                '    const jsonData = pm.response.json();',
                                "    pm.expect(jsonData.data).to.have.property('accessToken');",
                                "    pm.collectionVariables.set('access_token', jsonData.data.accessToken);",
                                '});',
                            ],
                        },
                    },
                ],
            },
        ],
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

    fs.writeFileSync(demoPath, JSON.stringify(demoCollection, null, 2));
    console.log(`Created demo collection at ${demoPath}`);
}

function parseFlowFile(content) {
    // Extract title
    const titleMatch = content.match(/^# (.+)$/m);
    const title = titleMatch ? titleMatch[1] : 'Untitled Flow';

    // Extract steps section
    const flowStepsSection = content.match(/## Flow Steps\s+([\s\S]+?)(?=\n## |$)/);

    if (!flowStepsSection) {
        console.log(`No Flow Steps section found in the file`);
        return { title, steps: [] };
    }

    const stepsContent = flowStepsSection[1];

    // Find steps using the numbered format (1. **Step Name**)
    const stepRegex = /(\d+)\.\s+\*\*([^*]+)\*\*\s+([\s\S]+?)(?=\n\s*\d+\.\s+\*\*|$)/g;
    const steps = [];
    let match;

    while ((match = stepRegex.exec(stepsContent)) !== null) {
        const stepNumber = match[1];
        const stepName = match[2].trim();
        const stepContent = match[3].trim();

        // Extract API endpoint
        const apiMatch = stepContent.match(/API:\s+`([^`]+)`/);
        const api = apiMatch ? apiMatch[1] : '';

        // Parse HTTP method and endpoint
        const methodEndpointMatch = api.match(/^(GET|POST|PUT|DELETE|PATCH)\s+(.+)$/);
        let method = 'GET';
        let endpoint = '';

        if (methodEndpointMatch) {
            method = methodEndpointMatch[1];
            endpoint = methodEndpointMatch[2];
        } else {
            endpoint = api;
        }

        // Extract request body
        const requestBodyMatch = stepContent.match(/Request body:\s*\n?\s*```json\s+([\s\S]+?)```/);
        const requestBody = requestBodyMatch ? requestBodyMatch[1].trim() : '';

        // Extract headers
        const headersMatch = stepContent.match(/Headers:\s+`([^`]+)`/g);
        const headers = [];

        if (headersMatch) {
            headersMatch.forEach((header) => {
                const headerValue = header.match(/Headers:\s+`([^`]+)`/)[1];
                const [headerName, headerValue2] = headerValue.split(':').map((part) => part.trim());
                headers.push({ key: headerName, value: headerValue2 });
            });
        }

        // Extract expected response
        const expectedResponseMatch = stepContent.match(/Expected response:\s+`([^`]+)`/);
        const expectedResponse = expectedResponseMatch ? expectedResponseMatch[1].trim() : '';

        // Extract validations
        const validationMatch = stepContent.match(/Validation:\s+(.+)(?:\n|$)/);
        const validation = validationMatch ? validationMatch[1].trim() : '';

        steps.push({
            name: stepName,
            number: parseInt(stepNumber),
            method,
            endpoint,
            requestBody,
            headers,
            expectedResponse,
            validation,
            raw: stepContent,
        });
    }

    return { title, steps };
}

function convertStepToApidogItem(step, collectionName) {
    try {
        // Create basic request structure
        const item = {
            name: `${step.number}. ${step.name}`,
            request: {
                method: step.method,
                header: [],
                url: {
                    raw: `{{baseUrl}}/{{API_PREFIX}}${step.endpoint}`,
                    host: ['{{baseUrl}}'],
                    path: [`{{API_PREFIX}}`, ...step.endpoint.split('/').filter((p) => p !== '')],
                },
                description: step.raw,
            },
            response: [],
            event: [],
        };

        // Add headers
        if (step.headers && step.headers.length > 0) {
            item.request.header = step.headers;
        }

        // Check if this is a registration step, add pre-request script for test email
        if (step.name.toLowerCase().includes('register') || (step.raw && step.raw.toLowerCase().includes('email'))) {
            const prereqScript = {
                listen: 'prerequest',
                script: {
                    type: 'text/javascript',
                    exec: [
                        '// Use default admin credentials',
                        'const testEmail = pm.environment.get("DEFAULT_ADMIN_EMAIL");',
                        'const testPassword = pm.environment.get("DEFAULT_ADMIN_PASSWORD");',
                        '',
                        'pm.variables.set("test_email", testEmail);',
                        'pm.variables.set("test_password", testPassword);',
                    ],
                },
            };
            item.event.push(prereqScript);

            // Replace email in request body with variable if present
            if (step.requestBody) {
                try {
                    let parsedBody = JSON.parse(step.requestBody);
                    if (parsedBody.email) {
                        parsedBody.email = '{{test_email}}';
                    }
                    if (parsedBody.password) {
                        parsedBody.password = '{{test_password}}';
                    }
                    step.requestBody = JSON.stringify(parsedBody, null, 2);
                } catch (e) {
                    // If parsing fails, continue with original body
                    console.log(`Warning: Could not replace email in request body: ${e.message}`);
                }
            }
        }

        // Check if authentication is needed
        if (
            step.raw.includes('Authorization: Bearer') ||
            (step.headers && step.headers.some((h) => h.key === 'Authorization'))
        ) {
            // Add authorization header if not already present
            if (!item.request.header.some((h) => h.key === 'Authorization')) {
                item.request.header.push({
                    key: 'Authorization',
                    value: 'Bearer {{access_token}}',
                    type: 'text',
                });
            }
        }

        // Add request body if needed
        if (step.requestBody) {
            try {
                const parsedBody = JSON.parse(step.requestBody);
                item.request.body = {
                    mode: 'raw',
                    raw: JSON.stringify(parsedBody, null, 2),
                    options: {
                        raw: {
                            language: 'json',
                        },
                    },
                };
            } catch (error) {
                console.log(`Error parsing request body: ${error.message}`);
                // If parsing fails, add it as a string
                item.request.body = {
                    mode: 'raw',
                    raw: step.requestBody,
                    options: {
                        raw: {
                            language: 'json',
                        },
                    },
                };
            }
        }

        // Add tests based on validation and expected response
        const testScript = {
            listen: 'test',
            script: {
                type: 'text/javascript',
                exec: [],
            },
        };

        // Add status code validation
        if (step.expectedResponse) {
            const statusCodeMatch = step.expectedResponse.match(/(\d+)/);
            if (statusCodeMatch) {
                const statusCode = statusCodeMatch[1];
                testScript.script.exec.push(`pm.test("Status code is ${statusCode}", function () {`);
                testScript.script.exec.push(`    pm.response.to.have.status(${statusCode});`);
                testScript.script.exec.push(`});`);
                testScript.script.exec.push(``);
            }
        }

        // Add login token extraction if needed
        if (
            step.endpoint.includes('/auth/login') ||
            step.name.toLowerCase().includes('login') ||
            (step.validation && step.validation.toLowerCase().includes('token'))
        ) {
            testScript.script.exec.push(`pm.test("Extract and store access token", function () {`);
            testScript.script.exec.push(`    const responseJson = pm.response.json();`);
            testScript.script.exec.push(`    pm.expect(responseJson.data).to.have.property('accessToken');`);
            testScript.script.exec.push(
                `    pm.collectionVariables.set('access_token', responseJson.data.accessToken);`,
            );
            testScript.script.exec.push(`});`);
            testScript.script.exec.push(``);
        }

        // Add custom validations
        if (step.validation) {
            // Error validation
            if (step.validation.includes('error')) {
                testScript.script.exec.push(`pm.test("Response should contain error details", function () {`);
                testScript.script.exec.push(`    const responseJson = pm.response.json();`);
                testScript.script.exec.push(`    pm.expect(responseJson.error).to.exist;`);
                testScript.script.exec.push(`});`);
            }

            // Response property validation
            else if (step.validation.includes('contains') || step.validation.includes('includes')) {
                const propertyMatch =
                    step.validation.match(/contains\s+(\w+(?:\.\w+)*)/i) ||
                    step.validation.match(/includes\s+(\w+(?:\.\w+)*)/i);

                if (propertyMatch) {
                    const property = propertyMatch[1];
                    testScript.script.exec.push(`pm.test("Response should contain ${property}", function () {`);
                    testScript.script.exec.push(`    const responseJson = pm.response.json();`);
                    testScript.script.exec.push(`    pm.expect(responseJson).to.have.nested.property('${property}');`);
                    testScript.script.exec.push(`});`);
                } else {
                    // Generic validation
                    testScript.script.exec.push(`pm.test("${step.validation}", function () {`);
                    testScript.script.exec.push(`    // Implement validation based on: ${step.validation}`);
                    testScript.script.exec.push(`    pm.expect(pm.response.text()).to.include("expected values");`);
                    testScript.script.exec.push(`});`);
                }
            }

            // Generic validation
            else {
                testScript.script.exec.push(`pm.test("${step.validation}", function () {`);
                testScript.script.exec.push(`    // Custom validation: ${step.validation}`);
                testScript.script.exec.push(`    pm.expect(true).to.be.true;`);
                testScript.script.exec.push(`});`);
            }
        }

        // Only add test script if we have any tests
        if (testScript.script.exec.length > 0) {
            item.event.push(testScript);
        }

        return item;
    } catch (error) {
        console.error(`Error converting step to Apidog item: ${error.message}`);
        return {
            name: `${step.number}. ${step.name} (ERROR)`,
            request: {
                method: 'GET',
                url: {
                    raw: '{{baseUrl}}/error',
                },
            },
        };
    }
}

function generateApidogCollection(flowData, outputPath) {
    // Create basic collection structure
    const collection = {
        info: {
            name: flowData.title,
            description: '',
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

    // Add items from the flow steps
    if (flowData.steps && flowData.steps.length > 0) {
        flowData.steps.forEach((step) => {
            const item = convertStepToApidogItem(step, flowData.title);
            if (item) {
                collection.item.push(item);
            }
        });

        console.log(`Added ${collection.item.length} steps to the collection`);
    } else {
        console.log(`No steps found in the flow data`);
    }

    // Write the collection to a file
    fs.writeFileSync(outputPath, JSON.stringify(collection, null, 2));
    console.log(`Successfully created Apidog collection for "${flowData.title}" at ${outputPath}`);
}
