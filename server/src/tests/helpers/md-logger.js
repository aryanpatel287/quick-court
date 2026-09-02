import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DOCS_OUTPUT_DIR = path.resolve(__dirname, '../../../../docs/api-docs');

export class FeatureApiDocLogger {
    /**
     * @param {string} filename - Output filename (e.g. "01_auth_user.md")
     * @param {string} title - Module Title (e.g. "Feature 01: Authentication API")
     * @param {string} description - Summary of the feature module
     */
    constructor(filename, title, description = '') {
        this.filename = filename;
        this.title = title;
        this.description = description;
        this.sections = [];
    }

    /**
     * Record an API test endpoint interaction
     */
    record({
        scenario,
        method,
        endpoint,
        headers,
        queryParams,
        requestBody,
        statusCode,
        responseBody,
        notes,
    }) {
        this.sections.push({
            scenario,
            method: method.toUpperCase(),
            endpoint,
            headers,
            queryParams,
            requestBody,
            statusCode,
            responseBody,
            notes,
        });
    }

    /**
     * Write captured API logs out to Markdown file
     */
    save() {
        if (!fs.existsSync(DOCS_OUTPUT_DIR)) {
            fs.mkdirSync(DOCS_OUTPUT_DIR, { recursive: true });
        }

        const filePath = path.join(DOCS_OUTPUT_DIR, this.filename);

        let markdown = `# ${this.title}\n\n`;
        if (this.description) {
            markdown += `> ${this.description}\n\n`;
        }

        markdown += `## 📋 Endpoints Overview\n\n`;
        markdown += `| Method | Endpoint | Scenario | Status |\n`;
        markdown += `| :--- | :--- | :--- | :--- |\n`;

        this.sections.forEach((s) => {
            markdown += `| \`${s.method}\` | \`${s.endpoint}\` | ${s.scenario} | \`${s.statusCode}\` |\n`;
        });

        markdown += `\n---\n\n## 🔍 Detailed Scenarios & Outputs\n\n`;

        this.sections.forEach((s, idx) => {
            markdown += `### ${idx + 1}. ${s.scenario}\n\n`;
            markdown += `- **Endpoint**: \`${s.method} ${s.endpoint}\`\n`;
            markdown += `- **Expected Status**: \`${s.statusCode}\`\n`;

            if (s.headers && Object.keys(s.headers).length > 0) {
                markdown += `- **Headers**:\n\`\`\`json\n${JSON.stringify(s.headers, null, 2)}\n\`\`\`\n`;
            }

            if (s.queryParams && Object.keys(s.queryParams).length > 0) {
                markdown += `- **Query Parameters**:\n\`\`\`json\n${JSON.stringify(s.queryParams, null, 2)}\n\`\`\`\n`;
            }

            if (s.requestBody && Object.keys(s.requestBody).length > 0) {
                markdown += `- **Request Body**:\n\`\`\`json\n${JSON.stringify(s.requestBody, null, 2)}\n\`\`\`\n`;
            } else if (s.requestBody !== undefined && s.method !== 'GET') {
                markdown += `- **Request Body**: *(None)*\n`;
            }

            markdown += `- **Response Body**:\n\`\`\`json\n${JSON.stringify(s.responseBody, null, 2)}\n\`\`\`\n`;

            if (s.notes) {
                markdown += `\n> **Note**: ${s.notes}\n`;
            }

            markdown += `\n---\n\n`;
        });

        fs.writeFileSync(filePath, markdown, 'utf8');
        console.log(`[API Doc Generated] -> ${filePath}`);
    }
}
