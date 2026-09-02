import { tavily } from '@tavily/core';
import envConfig from '../config/env.config.js';

const tvly = tavily({ apiKey: envConfig.TAVILY_API_KEY });

export async function searchWeb(query) {
    const options = {
        maxResults: 5,
        searchDepth: 'advanced',
        includeRawContent: 'markdown',
    };
    const hasRecencyKeyword = /\b(latest|recent|today|current|this year|newest)\b/i.test(query);
    const currentYear = new Date().getFullYear();

    if (hasRecencyKeyword) {
        options.timeRange = 'year';
        if (!query.includes(String(currentYear))) {
            query = `${query} ${currentYear}`;
        }
    }

    const response = await tvly.search(query, options);
    let results = response.results || [];

    if (hasRecencyKeyword && results.length > 0) {
        const filtered = results.filter((result) => {
            const text = `${result.title} ${result.content}`.toLowerCase();
            const hasOldYear = [2023, 2024, 2025].some((year) => text.includes(String(year)));
            const hasCurrentYear = text.includes(String(currentYear));
            return !hasOldYear || hasCurrentYear;
        });
        if (filtered.length > 0) {
            results = filtered;
        }
    }

    const processedResults = results.map((result) => {
        let content = result.content;
        if (result.rawContent) {
            content = result.rawContent.substring(0, 4000);
            if (result.rawContent.length > 4000) {
                content += '\n... [truncated for length]';
            }
        }
        return {
            title: result.title,
            url: result.url,
            content: content,
            score: result.score,
            publishedDate: result.publishedDate,
        };
    });

    return JSON.stringify(processedResults);
}
