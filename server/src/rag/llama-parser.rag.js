import LlamaCloud from '@llamaindex/llama-cloud';
import envConfig from '../config/env.config.js';
import fs from 'fs';

// filePath can be a local path or a URL
export default async function parseDocumentsByLlama(filePath) {
    const client = new LlamaCloud({
        apiKey: envConfig.LLAMA_CLOUD_API_KEY,
    });

    const parseParams = {
        tier: 'cost_effective',
        version: 'latest',
        output_options: { images_to_save: ['screenshot'] },
        expand: ['markdown_full', 'markdown', 'images_content_metadata'],
        input_options: {
            // Options for spreadsheets (.xlsx, .xls, .csv, .ods, .tsv)
            spreadsheet: {
                detect_sub_tables_in_sheets: true,
                force_formula_computation_in_sheets: true,
                include_hidden_sheets: true,
            },
            // Options for presentations (.pptx, .ppt, .key, .odp)
            presentation: {
                out_of_bounds_content: true,
                skip_embedded_data: false,
            },
            // Options for HTML pages (.html, .htm)
            html: {
                make_all_elements_visible: true,
                remove_navigation_elements: true,
                remove_fixed_elements: true,
            },
            // Options for camera photos & scans (.png, .jpg, .jpeg, .webp)
            // image: {
            //     camera_photo_correction: true,
            // },
        },
        processing_options: {
            ocr_parameters: {
                languages: ['en'],
            },
        },
    };

    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
        // Pass the URL directly so LlamaParse fetches and identifies the file extension correctly
        parseParams.source_url = filePath;
    } else {
        // Standard handling for local paths
        const file = await client.files.create({
            file: fs.createReadStream(filePath),
            purpose: 'parse',
        });
        parseParams.file_id = file.id;
    }

    const result = await client.parsing.parse(parseParams);

    return result;
}
