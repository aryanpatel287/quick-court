import pineconeIndex from '../services/pinecone.service.js';
import parseDocumentsByLlama from './llama-parser.rag.js';
import { processMarkdownPages } from './markdown-chunks.rag.js';
import { saveChunksToDb } from '../modules/rag/controllers/rag.controller.js';
import { mistralEmbeddingModel } from '../services/ai/models.ai.service.js';
import { updateFile } from '../dao/file.dao.js';
import { updateRagFile } from '../dao/ragFile.dao.js';

async function EmbedTheDocumentChunks(chunks, isGlobal) {
    if (!chunks || chunks?.length === 0) {
        console.error('No chunks to embed');
        throw new Error('No chunks to embed');
    }

    const docs = await Promise.all(
        chunks.map(async (chunk) => {
            const embeddedChunk = await mistralEmbeddingModel.embedQuery(chunk.text);

            return {
                id: chunk.id.toString(),
                values: embeddedChunk,
                metadata: {
                    file: chunk.fileId.toString(),
                    chat: isGlobal ? 'global' : chunk.chatId.toString(),
                },
            };
        }),
    );
    return docs;
}

async function upsertTheVectors(docs) {
    await pineconeIndex.upsert({
        records: docs,
    });
}

export async function deleteAllTheVectors() {
    try {
        const deleteResult = await pineconeIndex.deleteAll();
        console.log('All vectors deleted successfully');
        console.log('Delete result: ', deleteResult);
    } catch (error) {
        if (error.name === 'PineconeNotFoundError') {
            console.log('No vectors to delete (index is already empty).');
        } else {
            console.error('Failed to delete vectors:', error);
        }
    }
}

export async function dataIngestion({
    fileUrl,
    file,
    chat,
    documentType,
    source,
    markdownContent,
    isGlobal = false,
}) {
    let stage = 'init';

    try {
        let pages;
        if (!markdownContent) {
            stage = 'parse_pdf';
            pages = (await parseDocumentsByLlama(fileUrl)).markdown.pages;
        } else {
            stage = 'markdownContent_pages';
            if (!markdownContent.pages || markdownContent.pages.length == 0) {
                throw new Error('No pages found in markdown content');
            }
            pages = markdownContent.pages;
        }

        stage = 'chunk_markdown';
        const chunks = await processMarkdownPages(pages);

        const savedChunks = await saveChunksToDb({
            chunks,
            file,
            chat,
            documentType,
            source,
            isGlobal,
        });

        stage = 'embed_chunks';
        const docs = await EmbedTheDocumentChunks(savedChunks, isGlobal);

        stage = 'upsert_vectors';
        await upsertTheVectors(docs);

        if (isGlobal) {
            await updateRagFile(file, {
                ragStatus: 'completed',
            });
        } else {
            await updateFile(file, {
                ragStatus: 'completed',
            });
        }
    } catch (error) {
        if (isGlobal) {
            await updateRagFile(file, {
                ragStatus: 'failed',
            }).catch(console.error);
        } else {
            await updateFile(file, {
                ragStatus: 'failed',
            }).catch(console.error);
        }
        const message = error instanceof Error ? error.message : String(error);
        const wrappedError = new Error(`Data ingestion failed at ${stage}: ${message}`);
        wrappedError.cause = error;
        console.error(wrappedError);
    }
}
