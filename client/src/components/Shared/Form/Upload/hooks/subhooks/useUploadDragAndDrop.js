import { useState, useRef, useCallback } from 'react';

export function useUploadDragAndDrop({ disabled = false } = {}) {
    const [isDragActive, setIsDragActive] = useState(false);
    const fileInputRef = useRef(null);

    const handleDropzoneClick = useCallback(() => {
        if (disabled) return;
        fileInputRef.current?.click();
    }, [disabled]);

    const handleKeyDown = useCallback(
        (e) => {
            if (disabled) return;
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInputRef.current?.click();
            }
        },
        [disabled],
    );

    const handleDragEnter = useCallback(
        (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (disabled) return;
            setIsDragActive(true);
        },
        [disabled],
    );

    const handleDragOver = useCallback(
        (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (disabled) return;
            setIsDragActive(true);
        },
        [disabled],
    );

    const handleDragLeave = useCallback(
        (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (disabled) return;
            setIsDragActive(false);
        },
        [disabled],
    );

    return {
        isDragActive,
        setIsDragActive,
        fileInputRef,
        handleDropzoneClick,
        handleKeyDown,
        handleDragEnter,
        handleDragOver,
        handleDragLeave,
    };
}
