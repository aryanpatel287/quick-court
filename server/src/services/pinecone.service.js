import { Pinecone } from '@pinecone-database/pinecone';
import envConfig from '../config/env.config.js';

const pc = new Pinecone({
    apiKey: envConfig.PINECONE_API_KEY,
});

const pineconeIndex = pc.Index(envConfig.PINECONE_INDEX);

console.log('Pinecone Index Initialized');

export default pineconeIndex;
