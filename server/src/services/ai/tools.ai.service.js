import { tool } from 'langchain';
import * as z from 'zod';
import { sendEmail } from '../mail/mail.service.js';
import { searchWeb } from '../internet.service.js';
import { retrieveRelevantContext } from '../../rag/context-retrieval.rag.js';

/**
 * LangChain tool to send HTML emails using the internal mail service.
 * Expects recipient email address, subject line, and HTML body content.
 */
const emailTool = tool(sendEmail, {
    name: 'emailTool',
    description: 'Use this tool to send an email',
    schema: z.object({
        to: z.string().describe("The recipient's email address"),
        html: z.string().describe('The HTML content of the email'),
        subject: z.string().describe('The subject of the email'),
    }),
});

/**
 * LangChain tool to query the internet for real-time web search results.
 * Expects a query string.
 */
const searchInternetTool = tool(searchWeb, {
    name: 'searchInternetTool',
    description: 'Use this tool to search for the latest information on internet.',
    schema: z.string().describe('The query to search on web'),
});

/**
 * LangChain tool to get the current date and time.
 * Automatically configured for the 'Asia/Kolkata' (IST) timezone.
 */
const getCurrentDateTimeTool = tool(
    async () => {
        const now = new Date();

        const formatted = now.toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            dateStyle: 'full',
            timeStyle: 'medium',
        });

        const iso = now.toISOString();

        return JSON.stringify({
            readable: formatted,
            iso,
            timezone: 'Asia/Kolkata',
        });
    },
    {
        name: 'getCurrentDateTime',
        description:
            "Returns the current date and time in the user's timezone. Use this when the user asks about current time, today, now, or date.",
    },
);

/**
 * Factory function that creates a scoped LangChain context retriever tool (RAG) for a specific chat.
 * Scopes Pinecone vector queries to the provided chatId.
 *
 * @param {string} chatId - The active chat session ID to scope database retrieval.
 * @returns {import("langchain/tools").Tool} Dynamic tool instance loaded with chatId scope.
 * @throws {Error} Thrown at invocation time if chatId is missing from context.
 */
function createContextRetrieverTool(chatId) {
    return tool(
        async (query) => {
            return retrieveRelevantContext({ prompt: query, chatId });
        },
        {
            name: 'contextRetrieverTool',
            description:
                'Use this tool when the you think that there is need to retrieve relevant context for the query that user has asked. This is useful when you want to get information about the ingested data of the document and use that information to answer the user query.',
            schema: z.string().describe('The query to retrieve relevant context'),
        },
    );
}

export { emailTool, searchInternetTool, getCurrentDateTimeTool, createContextRetrieverTool };
