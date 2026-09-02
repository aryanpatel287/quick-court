import { useState, useRef } from 'react';
import { useToast } from '@/components/Shared/Feedback/Toast';
import { validateImageFile, getInitials } from './utils/avatarUploadUtils';
import { useAvatarCropEditor } from './hooks/useAvatarCropEditor';
import AvatarPreview from './subcomponents/AvatarPreview';
import AvatarEditorModal from './subcomponents/AvatarEditorModal';
import Dialog from '@/components/Shared/Feedback/Dialog';
import './AvatarUpload.scss';

export default function AvatarUpload({ value = null, onChange, onRemove, name = '', size = 110 }) {
    const { error: toastError } = useToast();
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef(null);

    const {
        isEditing,
        imageSrc,
        zoom,
        setZoom,
        rotation,
        flipH,
        flipV,
        pan,
        displaySize,
        imageRef,
        cutoutSize,
        openEditor,
        closeEditor,
        handleImageLoad,
        handleMouseDown,
        handleTouchStart,
        rotateLeft,
        rotateRight,
        toggleFlipH,
        toggleFlipV,
        resetTransformations,
        saveCroppedImage,
    } = useAvatarCropEditor({ cutoutSize: 240 });

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const handleFile = (file) => {
        if (!file) return;

        const validation = validateImageFile(file);
        if (!validation.valid) {
            toastError(validation.error);
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            openEditor(e.target.result);
        };
        reader.readAsDataURL(file);
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        handleFile(file);
        e.target.value = '';
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        const file = e.dataTransfer.files?.[0];
        handleFile(file);
    };

    const [isConfirmRemoveOpen, setIsConfirmRemoveOpen] = useState(false);

    const handleRemoveClick = (e) => {
        e.stopPropagation();
        setIsConfirmRemoveOpen(true);
    };

    const confirmRemoveAvatar = () => {
        if (onRemove) {
            onRemove();
        } else if (onChange) {
            onChange(null);
        }
        setIsConfirmRemoveOpen(false);
    };

    const handleSaveCropped = () => {
        const croppedUrl = saveCroppedImage();
        if (croppedUrl && onChange) {
            onChange(croppedUrl);
        }
    };

    const initials = getInitials(name);

    return (
        <div className="avatar-upload-main-container">
            <AvatarPreview
                value={value}
                initials={initials}
                size={size}
                dragActive={dragActive}
                fileInputRef={fileInputRef}
                triggerFileInput={triggerFileInput}
                handleFileChange={handleFileChange}
                handleDrag={handleDrag}
                handleDrop={handleDrop}
                handleRemoveClick={handleRemoveClick}
            />

            <AvatarEditorModal
                isOpen={isEditing}
                handleCancel={closeEditor}
                handleSave={handleSaveCropped}
                canvasProps={{
                    imageRef,
                    imageSrc,
                    displaySize,
                    pan,
                    rotation,
                    zoom,
                    flipH,
                    flipV,
                    cutoutSize,
                    handleImageLoad,
                    handleMouseDown,
                    handleTouchStart,
                }}
                controlProps={{
                    zoom,
                    setZoom,
                    rotateLeft,
                    rotateRight,
                    toggleFlipH,
                    toggleFlipV,
                    resetTransformations,
                }}
            />

            {/* Remove Avatar Confirmation Dialog */}
            <Dialog
                isOpen={isConfirmRemoveOpen}
                onClose={() => setIsConfirmRemoveOpen(false)}
                title="Remove Profile Picture"
                variant="danger"
                size="sm"
                confirmText="Remove Photo"
                cancelText="Cancel"
                onConfirm={confirmRemoveAvatar}
            >
                <p style={{ margin: 0, fontSize: '0.95rem', color: '#4b5563', lineHeight: 1.5 }}>
                    Are you sure you want to remove your current profile picture?
                </p>
            </Dialog>
        </div>
    );
}
