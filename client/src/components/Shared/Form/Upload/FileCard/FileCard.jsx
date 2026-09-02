import { formatBytes } from '../hooks/useUpload';
import {
    Trash2 as DeleteIcon,
    File as FileIcon,
    FileImage as FileImageIcon,
    FileArchive as FileArchiveIcon,
    FileCode as FileCodeIcon,
    FileText as FileTextIcon,
} from 'lucide-react';
import './FileCard.scss';

const getFileIcon = (file) => {
    const name = file.name.toLowerCase();
    const type = file.type.toLowerCase();

    if (type.startsWith('image/')) {
        return <FileImageIcon className="upload-file-type-icon-svg image" />;
    }
    if (type.includes('pdf') || name.endsWith('.pdf')) {
        return <FileTextIcon className="upload-file-type-icon-svg pdf" />;
    }
    if (
        type.includes('zip') ||
        type.includes('compressed') ||
        type.includes('tar') ||
        name.endsWith('.zip') ||
        name.endsWith('.rar') ||
        name.endsWith('.7z')
    ) {
        return <FileArchiveIcon className="upload-file-type-icon-svg zip" />;
    }
    if (
        type.includes('javascript') ||
        type.includes('json') ||
        type.includes('html') ||
        type.includes('css') ||
        name.endsWith('.js') ||
        name.endsWith('.jsx') ||
        name.endsWith('.ts') ||
        name.endsWith('.tsx') ||
        name.endsWith('.json') ||
        name.endsWith('.html') ||
        name.endsWith('.css') ||
        name.endsWith('.py')
    ) {
        return <FileCodeIcon className="upload-file-type-icon-svg code" />;
    }
    if (type.startsWith('text/') || name.endsWith('.txt') || name.endsWith('.md')) {
        return <FileTextIcon className="upload-file-type-icon-svg text" />;
    }

    return <FileIcon className="upload-file-type-icon-svg" />;
};

export default function FileCard({ file, onRemove, onRetry, disabled = false }) {
    const hasPreview = !!file.previewUrl;
    const isUploading = file.status === 'uploading';
    const isSuccess = file.status === 'success';
    const isError = file.status === 'error';

    return (
        <div className={`shared-upload-item-card ${file.status}`}>
            {/* Thumbnail / File Icon Preview */}
            <div className="shared-upload-item-preview">
                {hasPreview ? (
                    <img
                        src={file.previewUrl}
                        alt={file.name}
                        className="shared-upload-image-thumbnail"
                    />
                ) : (
                    getFileIcon(file)
                )}
            </div>

            {/* Info details */}
            <div className="shared-upload-item-details">
                <div className="shared-upload-item-header">
                    <span className="shared-upload-item-name" title={file.name}>
                        {file.name}
                    </span>
                    <span className="shared-upload-item-size">{formatBytes(file.size)}</span>
                </div>

                {/* Progress Bar & Status Text */}
                <div className="shared-upload-item-progress-section">
                    <div className="shared-upload-progress-wrapper">
                        <div
                            className={`shared-upload-progress-bar ${file.status}`}
                            style={{ width: isError ? '100%' : `${file.progress}%` }}
                        />
                    </div>
                    <div className="shared-upload-status-row">
                        <span className={`shared-upload-status-text ${file.status}`}>
                            {isUploading && `Uploading... ${file.progress}%`}
                            {isSuccess && 'Completed'}
                            {isError && 'Failed'}
                        </span>
                        {isError && file.error && (
                            <span className="shared-upload-error-msg" title={file.error}>
                                - {file.error}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Actions (Retry, Cancel / Delete) */}
            <div className="shared-upload-item-actions">
                {isError && !file.error?.includes('exceeds') && !file.error?.includes('type') && (
                    <button
                        type="button"
                        className="shared-upload-retry-btn"
                        onClick={() => onRetry(file.id)}
                        title="Retry upload"
                        disabled={disabled}
                    >
                        Retry
                    </button>
                )}
                <button
                    type="button"
                    className="shared-upload-delete-btn"
                    onClick={() => onRemove(file.id)}
                    title="Remove file"
                    aria-label={`Remove file ${file.name}`}
                    disabled={disabled}
                >
                    <DeleteIcon size={14} />
                </button>
            </div>
        </div>
    );
}
