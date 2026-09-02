import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOCS_DIR = path.resolve(__dirname, '../../docs/api-docs');
const OUTPUT_FILE = path.join(DOCS_DIR, 'postman_collection.json');

const HTTP_STATUS_MESSAGES = {
    200: 'OK',
    201: 'Created',
    202: 'Accepted',
    204: 'No Content',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    409: 'Conflict',
    422: 'Unprocessable Entity',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
};

function parseMarkdownDoc(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    let title = path.basename(filePath, '.md');
    let description = '';

    const firstHeader = lines.find((l) => l.startsWith('# '));
    if (firstHeader) title = firstHeader.replace('# ', '').trim();

    const descLine = lines.find((l) => l.startsWith('> '));
    if (descLine) description = descLine.replace('> ', '').trim();

    const scenarioBlocks = content.split(/\n### \d+\.\s+/).slice(1);

    const scenarios = scenarioBlocks.map((block) => {
        const scenarioTitle = block.split('\n')[0].trim();
        const endpointMatch = block.match(/- \*\*Endpoint\*\*:\s*`([A-Z]+)\s+([^`]+)`/);
        const method = endpointMatch ? endpointMatch[1] : 'GET';
        const rawEndpoint = endpointMatch ? endpointMatch[2] : '/';

        const statusMatch = block.match(/- \*\*Expected Status\*\*:\s*`?(\d+)`?/);
        const statusCode = statusMatch ? parseInt(statusMatch[1], 10) : 200;

        let headers = null;
        const headersMatch = block.match(/- \*\*Headers\*\*:\s*```json\s*([\s\S]*?)\s*```/);
        if (headersMatch) {
            try {
                headers = JSON.parse(headersMatch[1]);
            } catch (_e) {
                headers = null;
            }
        }

        let queryParams = null;
        const queryParamsMatch = block.match(
            /- \*\*Query Parameters\*\*:\s*```json\s*([\s\S]*?)\s*```/,
        );
        if (queryParamsMatch) {
            try {
                queryParams = JSON.parse(queryParamsMatch[1]);
            } catch (_e) {
                queryParams = null;
            }
        }

        let requestBody = null;
        const reqBodyMatch = block.match(/- \*\*Request Body\*\*:\s*```json\s*([\s\S]*?)\s*```/);
        if (reqBodyMatch) {
            try {
                requestBody = JSON.parse(reqBodyMatch[1]);
            } catch (_e) {
                requestBody = null;
            }
        }

        let responseBody = null;
        const resBodyMatch = block.match(/- \*\*Response Body\*\*:\s*```json\s*([\s\S]*?)\s*```/);
        if (resBodyMatch) {
            try {
                responseBody = JSON.parse(resBodyMatch[1]);
            } catch (_e) {
                responseBody = null;
            }
        }

        let notes = '';
        const notesMatch = block.match(/> \*\*Note\*\*:\s*(.*)/);
        if (notesMatch) notes = notesMatch[1].trim();

        return {
            scenario: scenarioTitle,
            method,
            endpoint: rawEndpoint,
            statusCode,
            headers,
            queryParams,
            requestBody,
            responseBody,
            notes,
        };
    });

    return { title, description, scenarios };
}

function buildPostmanUrl(rawEndpoint, queryParams) {
    const cleanPath = rawEndpoint.startsWith('/') ? rawEndpoint.slice(1) : rawEndpoint;
    const pathParts = cleanPath.split('/').filter(Boolean);

    let rawUrl = `{{baseUrl}}${rawEndpoint.startsWith('/') ? '' : '/'}${rawEndpoint}`;
    const query = [];

    if (queryParams && Object.keys(queryParams).length > 0) {
        const searchParams = new URLSearchParams();
        Object.entries(queryParams).forEach(([key, value]) => {
            searchParams.append(key, String(value));
            query.push({ key, value: String(value), description: '' });
        });
        rawUrl += `?${searchParams.toString()}`;
    }

    return {
        raw: rawUrl,
        host: ['{{baseUrl}}'],
        path: pathParts,
        query: query.length > 0 ? query : undefined,
    };
}

export function generatePostmanCollection({
    collectionName = 'Apex Template API Integration Collection',
    collectionDescription = 'Live tested Postman Collection with saved mock responses generated directly from Jest E2E test runs.',
    baseUrl = 'http://localhost:3000',
    docsDir = DOCS_DIR,
    outputFile = OUTPUT_FILE,
} = {}) {
    if (!fs.existsSync(docsDir)) {
        console.error(`[Error] Documentation directory not found at: ${docsDir}`);
        return null;
    }

    const mdFiles = fs
        .readdirSync(docsDir)
        .filter((file) => file.endsWith('.md') && file !== 'README.md' && file !== 'SKILL.md')
        .sort();

    const folders = [];

    for (const file of mdFiles) {
        const filePath = path.join(docsDir, file);
        const parsed = parseMarkdownDoc(filePath);

        if (!parsed.scenarios || parsed.scenarios.length === 0) continue;

        const endpointMap = new Map();
        parsed.scenarios.forEach((sc) => {
            const key = `${sc.method} ${sc.endpoint}`;
            if (!endpointMap.has(key)) endpointMap.set(key, []);
            endpointMap.get(key).push(sc);
        });

        const items = [];

        endpointMap.forEach((scenariosList) => {
            const primaryScenario = scenariosList[0];
            const urlObj = buildPostmanUrl(primaryScenario.endpoint, primaryScenario.queryParams);

            const headers = [{ key: 'Content-Type', value: 'application/json', type: 'text' }];
            if (primaryScenario.headers && primaryScenario.headers.Cookie) {
                headers.push({
                    key: 'Cookie',
                    value: primaryScenario.headers.Cookie,
                    type: 'text',
                    description: 'Authentication cookie',
                });
            }

            const requestBodyObj = primaryScenario.requestBody
                ? {
                      mode: 'raw',
                      raw: JSON.stringify(primaryScenario.requestBody, null, 2),
                      options: { raw: { language: 'json' } },
                  }
                : undefined;

            const responseExamples = scenariosList.map((sc) => {
                const statusText = HTTP_STATUS_MESSAGES[sc.statusCode] || 'OK';
                return {
                    name: `${sc.scenario} (${sc.statusCode} ${statusText})`,
                    originalRequest: {
                        method: sc.method,
                        header: headers,
                        body: sc.requestBody
                            ? { mode: 'raw', raw: JSON.stringify(sc.requestBody, null, 2) }
                            : undefined,
                        url: buildPostmanUrl(sc.endpoint, sc.queryParams),
                    },
                    status: statusText,
                    code: sc.statusCode,
                    _postman_previewlanguage: 'json',
                    header: [{ key: 'Content-Type', value: 'application/json' }],
                    cookie: [],
                    body: sc.responseBody ? JSON.stringify(sc.responseBody, null, 2) : '',
                };
            });

            items.push({
                name: primaryScenario.scenario,
                request: {
                    method: primaryScenario.method,
                    header: headers,
                    body: requestBodyObj,
                    url: urlObj,
                    description:
                        primaryScenario.notes ||
                        `${primaryScenario.method} ${primaryScenario.endpoint}`,
                },
                response: responseExamples,
            });
        });

        folders.push({
            name: parsed.title,
            description: parsed.description,
            item: items,
        });
    }

    const postmanCollection = {
        info: {
            _postman_id: crypto.randomUUID(),
            name: collectionName,
            description: collectionDescription,
            schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
        },
        item: folders,
        variable: [{ key: 'baseUrl', value: baseUrl, type: 'string' }],
    };

    fs.writeFileSync(outputFile, JSON.stringify(postmanCollection, null, 2), 'utf8');
    console.log(`[Postman Collection Generated] -> ${outputFile}`);
    console.log(`Successfully converted ${folders.length} modules into Postman v2.1.0 collection.`);
    return postmanCollection;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    generatePostmanCollection();
}
