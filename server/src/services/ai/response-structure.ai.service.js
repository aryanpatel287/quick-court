import { z } from 'zod';

/**
 * Zod schema defining the structured metadata structure returned when summarizing documents.
 * This structure captures titles, summaries, keywords, major sections, potential retrieval queries,
 * and context configurations to optimize future context retrieval.
 */
export const DocumentSummaryStructure = z.object({
    title: z.string().nullable().describe('Document title if identifiable'),

    summary: z
        .string()
        .describe(
            'Comprehensive summary of the document. Capture purpose, key ideas, important findings, and overall context.',
        ),

    keywords: z
        .array(z.string())
        .describe('Important keywords and phrases that best represent the document.'),

    sections: z
        .array(z.string())
        .describe('Major sections, chapters, slide groups, or topic areas found in the document.'),

    retrievalQueries: z
        .array(z.string())
        .describe(
            'Natural language search queries that users might ask about this document. These queries will later be used to improve retrieval.',
        ),

    suggestedSystemContext: z
        .string()
        .describe(
            'Compact context that can be injected into future chats to help the AI understand the document before retrieval.',
        ),
});
