import { useState, useRef, useEffect, useCallback } from 'react';
import { validateFile, createFileItem } from '../../utils/uploadUtils';

export function useUploadFileManager({
    multiple = false,
    accept = '',
    maxSize = Infinity,
    onUpload,
    onChange,
    autoUpload = true,
    disabled = false,
    fileInputRef,
    setIsDragActive,
} = {}) {
    const [files, setFiles] = useState([]);
    const uploadIntervalsRef = useRef({});
    const previewUrlsRef = useRef([]);

    // Clean up object URLs and active intervals ONLY on unmount
    useEffect(() => {
        return () => {
            previewUrlsRef.current.forEach((url) => {
                URL.revokeObjectURL(url);
            });
            previewUrlsRef.current = [];
            Object.values(uploadIntervalsRef.current).forEach(clearInterval);
        };
    }, []);

    const handleFilesChange = useCallback(
        (updatedFiles) => {
            setFiles(updatedFiles);
            if (onChange) {
                onChange(updatedFiles);
            }
        },
        [onChange],
    );

    const updateFileState = useCallback(
        (id, updates) => {
            setFiles((prev) => {
                const updated = prev.map((f) => (f.id === id ? { ...f, ...updates } : f));
                if (onChange) {
                    onChange(updated);
                }
                return updated;
            });
        },
        [onChange],
    );

    const startUpload = useCallback(
        (id, rawFile, currentFileList) => {
            const targetFileList = currentFileList || files;
            const progressList = targetFileList.map((f) =>
                f.id === id ? { ...f, status: 'uploading', progress: 0 } : f,
            );
            handleFilesChange(progressList);

            if (onUpload) {
                onUpload(rawFile, (progressPercent) => {
                    updateFileState(id, { progress: Math.min(progressPercent, 99) });
                })
                    .then((response) => {
                        updateFileState(id, { progress: 100, status: 'success', response });
                    })
                    .catch((err) => {
                        updateFileState(id, {
                            progress: 100,
                            status: 'error',
                            error: err?.message || 'Upload failed.',
                        });
                    });
            } else {
                let currentProgress = 0;
                const duration = Math.min(Math.max(rawFile.size / 10000, 1000), 4000);
                const intervalTime = 100;
                const totalSteps = duration / intervalTime;
                const increment = 100 / totalSteps;

                const intervalId = setInterval(() => {
                    currentProgress += increment + Math.random() * 4;
                    if (currentProgress >= 100) {
                        clearInterval(intervalId);
                        delete uploadIntervalsRef.current[id];
                        updateFileState(id, { progress: 100, status: 'success' });
                    } else {
                        updateFileState(id, {
                            progress: Math.min(Math.round(currentProgress), 99),
                        });
                    }
                }, intervalTime);

                uploadIntervalsRef.current[id] = intervalId;
            }
        },
        [files, onUpload, handleFilesChange, updateFileState],
    );

    const processSelectedFiles = useCallback(
        (newRawFiles) => {
            let rawFilesList = multiple ? newRawFiles : [newRawFiles[0]];

            const formattedFiles = rawFilesList.map((rawFile) => {
                const errorMsg = validateFile(rawFile, { maxSize, accept });
                return createFileItem(rawFile, errorMsg, (url) => previewUrlsRef.current.push(url));
            });

            const updatedFiles = multiple ? [...files, ...formattedFiles] : formattedFiles;
            handleFilesChange(updatedFiles);

            if (autoUpload) {
                formattedFiles.forEach((f) => {
                    if (f.status === 'idle') {
                        startUpload(f.id, f.rawFile, updatedFiles);
                    }
                });
            }
        },
        [files, multiple, accept, maxSize, autoUpload, startUpload, handleFilesChange],
    );

    const handleDrop = useCallback(
        (e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragActive(false);
            if (disabled) return;

            const droppedFiles = e.dataTransfer.files;
            if (droppedFiles && droppedFiles.length > 0) {
                processSelectedFiles(Array.from(droppedFiles));
            }
        },
        [disabled, processSelectedFiles, setIsDragActive],
    );

    const handleFileSelect = useCallback(
        (e) => {
            const selectedFiles = e.target.files;
            if (selectedFiles && selectedFiles.length > 0) {
                processSelectedFiles(Array.from(selectedFiles));
            }
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        },
        [processSelectedFiles, fileInputRef],
    );

    const removeFile = useCallback(
        (id) => {
            if (uploadIntervalsRef.current[id]) {
                clearInterval(uploadIntervalsRef.current[id]);
                delete uploadIntervalsRef.current[id];
            }

            setFiles((prev) => {
                const target = prev.find((f) => f.id === id);
                if (target && target.previewUrl) {
                    URL.revokeObjectURL(target.previewUrl);
                }
                const filtered = prev.filter((f) => f.id !== id);
                if (onChange) {
                    onChange(filtered);
                }
                return filtered;
            });
        },
        [onChange],
    );

    const clearAllFiles = useCallback(() => {
        Object.values(uploadIntervalsRef.current).forEach(clearInterval);
        uploadIntervalsRef.current = {};

        files.forEach((f) => {
            if (f.previewUrl) {
                URL.revokeObjectURL(f.previewUrl);
            }
        });

        handleFilesChange([]);
    }, [files, handleFilesChange]);

    const handleRetry = useCallback(
        (id) => {
            const fileItem = files.find((f) => f.id === id);
            if (!fileItem) return;

            updateFileState(id, { status: 'idle', progress: 0, error: null });
            startUpload(id, fileItem.rawFile);
        },
        [files, startUpload, updateFileState],
    );

    return {
        files,
        handleDrop,
        handleFileSelect,
        removeFile,
        clearAllFiles,
        handleRetry,
        startUpload,
    };
}
