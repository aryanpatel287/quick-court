import { useCallback } from 'react';
import { useChatStore } from '../store/useChatStore';
import { chatStore } from '../store/chatStore';
import * as uploadService from '../services/upload.service';

export function useUpload() {
    const store = useChatStore();

    const uploadFiles = useCallback(async (rawFiles) => {
        if (!rawFiles || rawFiles.length === 0) return;

        chatStore.setUploading(true);

        const placeholders = Array.from(rawFiles).map((file) => {
            const id = `attachment-${Date.now()}-${Math.random()}`;
            return {
                id,
                filename: file.name,
                name: file.name,
                mediaType: file.type,
                type: 'file',
                url: URL.createObjectURL(file),
                status: 'uploading',
                rawFile: file,
            };
        });

        // Add placeholders locally for instant preview and progress spinner
        placeholders.forEach((p) => chatStore.addAttachedFile(p));

        try {
            const filesToUpload = placeholders.map((p) => p.rawFile);
            const uploadedResults = await uploadService.uploadFiles(filesToUpload);

            placeholders.forEach((p, idx) => {
                const result = uploadedResults[idx];
                if (result) {
                    chatStore.updateAttachedFile(p.id, {
                        fileId: result.fileId,
                        name: result.name,
                        filename: result.name,
                        size: result.size,
                        filePath: result.filePath,
                        url: result.url,
                        fileType: result.fileType,
                        mimetype: result.mimetype,
                        status: 'completed',
                    });
                } else {
                    chatStore.updateAttachedFile(p.id, { status: 'failed' });
                }
            });
        } catch (err) {
            console.error('Failed to upload files:', err);
            placeholders.forEach((p) => {
                chatStore.updateAttachedFile(p.id, { status: 'failed' });
            });
            chatStore.setError(err.message || 'Attachment upload failed');
        } finally {
            chatStore.setUploading(false);
        }
    }, []);

    const removeFile = useCallback((fileId) => {
        chatStore.removeAttachedFile(fileId);
    }, []);

    const clearAttachments = useCallback(() => {
        chatStore.setAttachedFiles([]);
    }, []);

    return {
        attachedFiles: store.attachedFiles,
        isUploading: store.isUploading,
        uploadFiles,
        removeFile,
        clearAttachments,
    };
}
