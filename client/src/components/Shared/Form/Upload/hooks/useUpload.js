import { useUploadDragAndDrop } from './subhooks/useUploadDragAndDrop';
import { useUploadFileManager } from './subhooks/useUploadFileManager';

export { formatBytes, isAccepted } from '../utils/uploadUtils';

export default function useUpload({
    multiple = false,
    accept = '',
    maxSize = Infinity,
    onUpload,
    onChange,
    autoUpload = true,
    disabled = false,
} = {}) {
    const {
        isDragActive,
        setIsDragActive,
        fileInputRef,
        handleDropzoneClick,
        handleKeyDown,
        handleDragEnter,
        handleDragOver,
        handleDragLeave,
    } = useUploadDragAndDrop({ disabled });

    const {
        files,
        handleDrop,
        handleFileSelect,
        removeFile,
        clearAllFiles,
        handleRetry,
        startUpload,
    } = useUploadFileManager({
        multiple,
        accept,
        maxSize,
        onUpload,
        onChange,
        autoUpload,
        disabled,
        fileInputRef,
        setIsDragActive,
    });

    return {
        files,
        isDragActive,
        fileInputRef,
        handleDropzoneClick,
        handleKeyDown,
        handleDragEnter,
        handleDragOver,
        handleDragLeave,
        handleDrop,
        handleFileSelect,
        removeFile,
        clearAllFiles,
        handleRetry,
        startUpload,
    };
}
