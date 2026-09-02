/**
 * Helper to format bytes to human-readable size string.
 */
export const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Helper to validate extension or MIME type matches accepted prop string.
 */
export const isAccepted = (file, acceptStr) => {
    if (!acceptStr) return true;
    const acceptedTypes = acceptStr.split(',').map((type) => type.trim());
    const fileName = file.name.toLowerCase();
    const fileType = file.type.toLowerCase();

    return acceptedTypes.some((type) => {
        if (type.startsWith('.')) {
            return fileName.endsWith(type.toLowerCase());
        }
        if (type.endsWith('/*')) {
            const baseType = type.split('/')[0].toLowerCase();
            return fileType.startsWith(baseType + '/');
        }
        return fileType === type.toLowerCase();
    });
};

/**
 * Validates file against maxSize and accept rules.
 */
export const validateFile = (rawFile, { maxSize = Infinity, accept = '' } = {}) => {
    if (rawFile.size > maxSize) {
        return `File size exceeds the maximum limit of ${formatBytes(maxSize)}.`;
    }
    if (!isAccepted(rawFile, accept)) {
        return `File type is not supported. Please select valid file types.`;
    }
    return null;
};

/**
 * Constructs a standardized file item object for upload state tracking.
 */
export const createFileItem = (rawFile, validationError, trackPreviewUrl) => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const isImage = rawFile.type.startsWith('image/');
    const previewUrl = isImage ? URL.createObjectURL(rawFile) : null;

    if (previewUrl && trackPreviewUrl) {
        trackPreviewUrl(previewUrl);
    }

    return {
        id,
        name: rawFile.name,
        size: rawFile.size,
        type: rawFile.type,
        rawFile,
        progress: validationError ? 100 : 0,
        status: validationError ? 'error' : 'idle',
        error: validationError,
        previewUrl,
    };
};
