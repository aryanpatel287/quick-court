/**
 * Trigger client-side browser download for a PDF returned as binary Blob from the API
 *
 * @param {string} url - API endpoint (e.g. '/api/pdf/invoice/INV-2026-0042')
 * @param {string} [defaultFilename='document.pdf'] - Fallback filename
 * @param {object} [fetchOptions={}] - Optional fetch init options
 */
export async function downloadPdfFromApi(url, defaultFilename = 'document.pdf', fetchOptions = {}) {
    try {
        const response = await fetch(url, {
            method: 'GET',
            credentials: 'include',
            ...fetchOptions,
        });

        if (!response.ok) {
            throw new Error(`Failed to download PDF (HTTP ${response.status})`);
        }

        const blob = await response.blob();

        // Parse filename from Content-Disposition header if present
        let filename = defaultFilename;
        const disposition = response.headers.get('Content-Disposition');
        if (disposition && disposition.includes('filename=')) {
            const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
            if (matches && matches[1]) {
                filename = matches[1].replace(/['"]/g, '').trim();
            }
        }

        // Create temporary anchor link to trigger download
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();

        // Cleanup
        setTimeout(() => {
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        }, 200);

        return true;
    } catch (error) {
        console.error('PDF download error:', error);
        throw error;
    }
}
