import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

// SPLITTER

const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 700,
    chunkOverlap: 120,
});

// MERGE DOCUMENT

function mergeMarkdownPages(pages) {
    return pages
        .map((page) => {
            return `<!-- PAGE:${page.page_number} -->\n${page.markdown}`;
        })
        .join('\n\n');
}

// PAGE TRACKER

function extractPageNumbers(text) {
    const matches = [...text.matchAll(/<!-- PAGE:(\d+) -->/g)];

    return matches.map((match) => Number(match[1]));
}

// REMOVE PAGE MARKERS

function removePageMarkers(text) {
    return text.replace(/<!-- PAGE:\d+ -->/g, '');
}

// CLEAN MARKDOWN

function cleanMarkdown(text) {
    return text.replace(/\n{3,}/g, '\n\n').trim();
}

function markdownToText(markdown) {
    return markdown
        .replace(/```[\s\S]*?```/g, '')
        .replace(/`(.+?)`/g, '$1')
        .replace(/!\[.*?\]\(.*?\)/g, '')
        .replace(/\[([^\]]+)\]\((.*?)\)/g, '$1')
        .replace(/^#{1,6}\s+/gm, '')
        .replace(/[*_~>-]/g, '')
        .replace(/\n{2,}/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

// PARSE MARKDOWN STRUCTURE

function parseMarkdownStructure(markdown) {
    const lines = markdown.split('\n');

    const sections = [];

    let currentHeaders = {
        h1: null,
        h2: null,
        h3: null,
    };

    let currentContent = [];

    let currentStartPage = 1;

    function pushSection() {
        if (!currentContent.length) return;

        sections.push({
            ...currentHeaders,

            startPage: currentStartPage,

            content: currentContent.join('\n'),
        });
    }

    for (const rawLine of lines) {
        const line = rawLine.trim();

        // PAGE MARKER

        const pageNumber = extractPageNumbers(line);

        if (pageNumber.length > 0) {
            currentStartPage = pageNumber[0];
            continue;
        }

        // H3

        if (line.startsWith('### ')) {
            pushSection();

            currentHeaders = {
                ...currentHeaders,
                h3: line.replace('### ', ''),
            };

            currentContent = [];

            continue;
        }

        // H2

        if (line.startsWith('## ')) {
            pushSection();

            currentHeaders = {
                ...currentHeaders,
                h2: line.replace('## ', ''),
                h3: null,
            };

            currentContent = [];

            continue;
        }

        // H1

        if (line.startsWith('# ')) {
            pushSection();

            currentHeaders = {
                h1: line.replace('# ', ''),
                h2: null,
                h3: null,
            };

            currentContent = [];

            continue;
        }

        // NORMAL CONTENT

        currentContent.push(rawLine);
    }

    pushSection();

    return sections;
}

// CHUNK SECTION

async function chunkSection(section, globalChunkIndex) {
    const docs = await splitter.createDocuments([section.content]);

    return docs.map((doc, index) => {
        const pages = extractPageNumbers(doc.pageContent);

        const startPage = pages.length ? Math.min(...pages) : section.startPage;

        const endPage = pages.length ? Math.max(...pages) : section.startPage;

        const cleanedMarkdown = cleanMarkdown(removePageMarkers(doc.pageContent));

        const plainText = markdownToText(cleanedMarkdown);

        return {
            markdown: cleanedMarkdown,
            text: plainText,

            metadata: {
                h1: section.h1,
                h2: section.h2,
                h3: section.h3,

                startPage,
                endPage,

                chunkIndex: globalChunkIndex + index,
            },
        };
    });
}

// MAIN PROCESSOR

export async function processMarkdownPages(pages) {
    if (!pages || pages?.length === 0) {
        console.error('No markdown pages to process');
        throw new Error('No markdown pages to process');
    }

    // MERGE DOCUMENT

    const mergedMarkdown = mergeMarkdownPages(pages);

    // PARSE STRUCTURE

    const sections = parseMarkdownStructure(mergedMarkdown);

    // FINAL CHUNKS

    const finalChunks = [];

    let globalChunkIndex = 0;

    for (const section of sections) {
        const chunks = await chunkSection(section, globalChunkIndex);

        globalChunkIndex += chunks.length;

        finalChunks.push(...chunks);
    }

    return finalChunks;
}
