import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import Button from '@/components/Shared/Buttons/Button/Button';
import AvatarEditorCanvas from './AvatarEditorCanvas';
import AvatarEditorControls from './AvatarEditorControls';

export default function AvatarEditorModal({
    isOpen,
    handleCancel,
    handleSave,
    canvasProps,
    controlProps,
}) {
    if (!isOpen) return null;

    return createPortal(
        <div className="avatar-editor-modal-overlay">
            <div className="avatar-editor-card">
                <div className="avatar-editor-header">
                    <h3 className="avatar-editor-title">Edit Profile Photo</h3>
                    <button
                        type="button"
                        className="close-btn"
                        onClick={handleCancel}
                        aria-label="Close dialog"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="avatar-editor-body">
                    <AvatarEditorCanvas {...canvasProps} />
                    <AvatarEditorControls {...controlProps} />
                </div>

                <div className="avatar-editor-footer">
                    <Button preset="cancel" onClick={handleCancel} label="Cancel" />
                    <Button preset="save" onClick={handleSave} label="Apply & Save" size="md" />
                </div>
            </div>
        </div>,
        document.body,
    );
}
