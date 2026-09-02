import { useState } from 'react';
import FileCard from '../FileCard/FileCard';
import Dialog from '@/components/Shared/Feedback/Dialog';
import Button from '@/components/Shared/Buttons/Button/Button';
import './FileList.scss';

export default function FileList({ files = [], onRemove, onRetry, onClearAll, disabled = false }) {
    const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);

    if (files.length === 0) return null;

    const handleClearClick = () => {
        setIsConfirmClearOpen(true);
    };

    const confirmClearAll = () => {
        if (onClearAll) onClearAll();
        setIsConfirmClearOpen(false);
    };

    return (
        <div className="shared-upload-list-container">
            <div className="shared-upload-list-header">
                <span className="shared-upload-list-title">Selected files ({files.length})</span>
                <Button
                    preset="clear-all"
                    label="Clear All"
                    variant="danger"
                    size="sm"
                    onClick={handleClearClick}
                    disabled={disabled}
                />
            </div>

            <div className="shared-upload-list-items">
                {files.map((file) => (
                    <FileCard
                        key={file.id}
                        file={file}
                        onRemove={onRemove}
                        onRetry={onRetry}
                        disabled={disabled}
                    />
                ))}
            </div>

            {/* Clear All Files Confirmation Dialog */}
            <Dialog
                isOpen={isConfirmClearOpen}
                onClose={() => setIsConfirmClearOpen(false)}
                title="Clear All Uploads"
                variant="danger"
                size="sm"
                confirmText="Remove All Files"
                cancelText="Cancel"
                onConfirm={confirmClearAll}
            >
                <p style={{ margin: 0, fontSize: '0.95rem', color: '#4b5563', lineHeight: 1.5 }}>
                    Are you sure you want to remove all {files.length} attached file
                    {files.length > 1 ? 's' : ''}?
                </p>
            </Dialog>
        </div>
    );
}
