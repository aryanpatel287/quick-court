import useUpload from '../hooks/useUpload';
import FileList from '../FileList/FileList';
import { Upload as UploadIcon } from 'lucide-react';
import './ButtonUpload.scss';

export default function ButtonUpload({
    multiple = false,
    accept = 'application/pdf,image/*,text/plain',
    maxSize = 5 * 1024 * 1024, // 5MB default for documents
    label,
    helperText,
    onUpload,
    onChange,
    disabled = false,
    autoUpload = true,
    className = '',
}) {
    const {
        files,
        fileInputRef,
        handleDropzoneClick,
        handleFileSelect,
        removeFile,
        handleRetry,
        clearAllFiles,
    } = useUpload({
        multiple,
        accept,
        maxSize,
        onUpload,
        onChange,
        autoUpload,
        disabled,
    });

    return (
        <div className={`shared-upload-container ${className}`}>
            {label && <label className="shared-upload-label">{label}</label>}

            <div
                className={`shared-upload-dropzone button ${disabled ? 'disabled' : ''}`}
                onClick={handleDropzoneClick}
                aria-label={label || 'File selector button'}
                aria-disabled={disabled}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    className="shared-upload-file-input"
                    multiple={multiple}
                    accept={accept}
                    onChange={handleFileSelect}
                    disabled={disabled}
                    style={{ display: 'none' }}
                />

                <div className="shared-upload-button-layout">
                    <button
                        type="button"
                        className="shared-upload-action-btn"
                        disabled={disabled}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDropzoneClick();
                        }}
                    >
                        <UploadIcon size={16} className="upload-icon-cloud" />
                        Choose {multiple ? 'Files' : 'a File'}
                    </button>
                    {helperText && (
                        <span className="shared-upload-helper-inline">{helperText}</span>
                    )}
                </div>
            </div>

            <FileList
                files={files}
                onRemove={removeFile}
                onRetry={handleRetry}
                onClearAll={clearAllFiles}
                disabled={disabled}
            />
        </div>
    );
}
