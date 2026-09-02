import { Upload, Trash2, Plus, Pencil } from 'lucide-react';

export default function AvatarPreview({
    value,
    size,
    dragActive,
    fileInputRef,
    triggerFileInput,
    handleFileChange,
    handleDrag,
    handleDrop,
    handleRemoveClick,
}) {
    return (
        <>
            <div
                className={`avatar-preview-ring ${dragActive ? 'drag-active' : ''}`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                style={{ width: `${size}px`, height: `${size}px` }}
            >
                <button
                    type="button"
                    className="avatar-interactive-preview"
                    onClick={triggerFileInput}
                    title="Upload or Change Photo"
                >
                    {value &&
                    value !== 'https://ik.imagekit.io/2bzzjhgkg/defaul_profile_image.jpeg' ? (
                        <img src={value} alt="Profile preview" className="avatar-actual-image" />
                    ) : (
                        <img
                            src="https://ik.imagekit.io/2bzzjhgkg/defaul_profile_image.jpeg"
                            alt="Default profile preview"
                            className="avatar-actual-image"
                        />
                    )}

                    {/* Hover overlay */}
                    <div className="avatar-hover-overlay">
                        {value &&
                        value !== 'https://ik.imagekit.io/2bzzjhgkg/defaul_profile_image.jpeg' ? (
                            <Pencil size={18} />
                        ) : (
                            <Plus size={20} />
                        )}
                        <span className="hover-text">
                            {value &&
                            value !== 'https://ik.imagekit.io/2bzzjhgkg/defaul_profile_image.jpeg'
                                ? 'Change'
                                : 'Upload'}
                        </span>
                    </div>
                </button>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="avatar-hidden-file-input"
                    onChange={handleFileChange}
                />
            </div>

            <div className="avatar-actions-buttons">
                <button
                    type="button"
                    className="upload-action-btn primary-action"
                    onClick={triggerFileInput}
                >
                    <Upload size={14} />
                    <span>Upload Image</span>
                </button>

                {value &&
                    value !== 'https://ik.imagekit.io/2bzzjhgkg/defaul_profile_image.jpeg' && (
                        <button
                            type="button"
                            className="upload-action-btn danger-action"
                            onClick={handleRemoveClick}
                        >
                            <Trash2 size={14} />
                            <span>Remove</span>
                        </button>
                    )}
            </div>

            <span className="upload-tip-text">
                Supported formats: JPEG, PNG, JPG, WEBP, GIF (max. 5MB).
                <br />
                Drag & drop or click preview to browse.
            </span>
        </>
    );
}
