import { Pinecone } from '@pinecone-database/pinecone';
import { mistralEmbeddingModel } from '../services/ai/models.ai.service.js';
import { retrieveChunksFromDb } from '../modules/rag/controllers/rag.controller.js';
import envConfig from '../config/env.config.js';

const pc = new Pinecone({ apiKey: envConfig.PINECONE_API_KEY });

const index = pc.Index('cohort-2-rag');

export async function retrieveRelevantContext(input) {
    let prompt;
    let chatId;

    if (typeof input === 'string') {
        prompt = input;
    } else if (input && typeof input === 'object') {
        prompt = input.prompt;
        chatId = input.chatId;
    }

    if (!prompt) {
        return JSON.stringify([]);
    }

    const queryEmbedding = await mistralEmbeddingModel.embedQuery(prompt);

    const queryOptions = {
        vector: queryEmbedding,
        topK: 3,
        includeMetadata: true,
    };

    if (chatId) {
        queryOptions.filter = { chat: { $in: [chatId, 'global'] } };
    } else {
        queryOptions.filter = { chat: { $eq: 'global' } };
    }

    const _queryResult = await index.query(queryOptions);

    const matchIds = (_queryResult.matches || []).map((match) => match.id);
    const retrievedChunks = matchIds.length > 0 ? await retrieveChunksFromDb(matchIds, chatId) : [];

    return JSON.stringify(retrievedChunks);
}
