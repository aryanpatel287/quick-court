import { ChatGoogle } from '@langchain/google';
import { ChatMistralAI, MistralAIEmbeddings } from '@langchain/mistralai';
import { createAgent, modelCallLimitMiddleware } from 'langchain';
import {
    emailTool,
    getCurrentDateTimeTool,
    searchInternetTool,
    createContextRetrieverTool,
} from './tools.ai.service.js';
import envConfig from '../../config/env.config.js';
import { DocumentSummaryStructure } from './response-structure.ai.service.js';

/**
 * System prompt for the tool-calling AI agents.
 * Outlines rules for tool usage, time/date queries, and uncertainty handling.
 */
const getToolAgentSystemPrompt = () => {
    const now = new Date();
    const dateString = now.toLocaleString('en-US', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'full',
    });
    return `You are an AI assistant that can use tools when needed.

Rules:

* If data is real-time, future, or uncertain → use tools
* Never guess unknown facts
* Never claim tool usage unless actually called
* If tool is needed → return ONLY tool call
* Otherwise → return final answer

Time Awareness:

* Today's date is: ${dateString}.
* Whenever the user asks for 'latest', 'current', 'today', 'recent', or 'this year', always treat the current year as 2026.
* If the user asks about current time, date, today, or now → MUST call the 'getCurrentDateTimeTool' tool
* Never guess current time or date
* Never answer time-related queries from memory
* Always rely on the tool for accurate time information

If unsure → use tools, not reasoning.`;
};

// ==========================================
// Google Gemini Models & Agent Factories
// ==========================================

/**
 * Primary Google GenAI Chat model.
 * Uses the high-capability 'gemma-4-31b-it' model.
 */
const geminiModel = new ChatGoogle({
    model: 'gemma-4-31b-it',
    apiKey: envConfig.GEMINI_API_KEY,
    maxConcurrency: 3,
    thinkingConfig: {
        includeThoughts: false,
    },
});

/**
 * Creates and configures a Gemini AI Agent instance scoped to a specific chat context.
 *
 * @param {string} [chatId] - The ID of the current chat session to scope search context.
 * @returns {import("langchain").Agent} Configured LangChain agent instance.
 */
export function getGeminiAgent(chatId) {
    const contextRetrieverToolForChat = createContextRetrieverTool(chatId);

    return createAgent({
        model: geminiModel,
        systemPrompt: getToolAgentSystemPrompt(),
        tools: [emailTool, searchInternetTool, getCurrentDateTimeTool, contextRetrieverToolForChat],
        middleware: [
            modelCallLimitMiddleware({
                runLimit: 5,
                exitBehavior: 'end',
            }),
        ],
    });
}

/**
 * Scopeless default Gemini agent instance.
 */
export const geminiAgent = getGeminiAgent();

/**
 * Fallback Gemini Chat model.
 * Uses the faster, highly-available 'gemini-3.1-flash-lite' model.
 */
const geminiFallbackModel = new ChatGoogle({
    model: 'gemini-3.1-flash-lite',
    apiKey: envConfig.GEMINI_API_KEY,
    maxConcurrency: 5,
    thinkingConfig: {
        includeThoughts: false,
    },
});

/**
 * Creates and configures a Fallback Gemini AI Agent instance scoped to a specific chat context.
 *
 * @param {string} [chatId] - The ID of the current chat session to scope search context.
 * @returns {import("langchain").Agent} Configured LangChain fallback agent instance.
 */
export function getGeminiFallbackAgent(chatId) {
    const contextRetrieverToolForChat = createContextRetrieverTool(chatId);

    return createAgent({
        model: geminiFallbackModel,
        systemPrompt: getToolAgentSystemPrompt(),
        tools: [emailTool, searchInternetTool, getCurrentDateTimeTool, contextRetrieverToolForChat],
        middleware: [
            modelCallLimitMiddleware({
                runLimit: 5,
                exitBehavior: 'end',
            }),
        ],
    });
}

/**
 * Scopeless fallback Gemini agent instance.
 */
export const geminiFallbackAgent = getGeminiFallbackAgent();

/**
 * Model specifically configured for document summarization tasks.
 */
export const geminiSummariseModel = new ChatGoogle({
    model: 'gemini-3.1-flash-lite',
    apiKey: envConfig.GEMINI_API_KEY,
    maxConcurrency: 5,
    thinkingConfig: {
        includeThoughts: false,
    },
});

/**
 * Agent specialized in parsing and summarising documents into structured metadata.
 */
export const geminiSummariseAgent = createAgent({
    model: geminiSummariseModel,
    responseFormat: DocumentSummaryStructure,
});

// ==========================================
// Mistral AI Models & Agent Factories
// ==========================================

/**
 * Primary Mistral Chat model.
 * Uses the high-capability 'mistral-medium-latest' model.
 */
const mistralModel = new ChatMistralAI({
    model: 'mistral-medium-latest',
    apiKey: envConfig.MISTRAL_API_KEY,
    maxConcurrency: 3,
});

/**
 * Mistral Embedding model used for vector representations.
 */
const mistralEmbeddingModel = new MistralAIEmbeddings({
    apiKey: envConfig.MISTRAL_API_KEY,
    model: 'mistral-embed',
});

/**
 * Creates and configures a Mistral AI Agent instance scoped to a specific chat context.
 *
 * @param {string} [chatId] - The ID of the current chat session to scope search context.
 * @returns {import("langchain").Agent} Configured LangChain Mistral agent instance.
 */
export function getMistralAgent(chatId) {
    const contextRetrieverToolForChat = createContextRetrieverTool(chatId);

    return createAgent({
        model: mistralModel,
        systemPrompt: getToolAgentSystemPrompt(),
        tools: [emailTool, searchInternetTool, getCurrentDateTimeTool, contextRetrieverToolForChat],
        middleware: [
            modelCallLimitMiddleware({
                runLimit: 5,
                exitBehavior: 'end',
            }),
        ],
    });
}

/**
 * Scopeless default Mistral agent instance.
 */
export const mistralAgent = getMistralAgent();

export { geminiModel, mistralModel, mistralEmbeddingModel };
