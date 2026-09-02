import { useState, useRef, useEffect } from 'react';
import { generateCroppedAvatar } from '../utils/avatarUploadUtils';

export function useAvatarCropEditor({ cutoutSize = 240 } = {}) {
    const [isEditing, setIsEditing] = useState(false);
    const [imageSrc, setImageSrc] = useState(null);

    // Transformation states
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [flipH, setFlipH] = useState(false);
    const [flipV, setFlipV] = useState(false);
    const [pan, setPan] = useState({ x: 0, y: 0 });

    // Image dimension sizing
    const [baseScale, setBaseScale] = useState(1);
    const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });

    const imageRef = useRef(null);

    // Lock document body scroll while modal is open
    useEffect(() => {
        if (isEditing) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isEditing]);

    const openEditor = (srcUrl) => {
        setImageSrc(srcUrl);
        setZoom(1);
        setRotation(0);
        setFlipH(false);
        setFlipV(false);
        setPan({ x: 0, y: 0 });
        setIsEditing(true);
    };

    const closeEditor = () => {
        setIsEditing(false);
        setImageSrc(null);
    };

    const handleImageLoad = () => {
        if (!imageRef.current) return;
        const img = imageRef.current;
        const naturalW = img.naturalWidth;
        const naturalH = img.naturalHeight;

        const ratioW = cutoutSize / naturalW;
        const ratioH = cutoutSize / naturalH;
        const scale = Math.max(ratioW, ratioH);

        setBaseScale(scale);
        setDisplaySize({
            width: naturalW * scale,
            height: naturalH * scale,
        });
    };

    // Mouse & Touch Pan Handlers
    const handleMouseDown = (e) => {
        e.preventDefault();
        const startX = e.clientX - pan.x;
        const startY = e.clientY - pan.y;

        const handleMouseMove = (moveEvent) => {
            setPan({
                x: moveEvent.clientX - startX,
                y: moveEvent.clientY - startY,
            });
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleTouchStart = (e) => {
        if (e.touches.length !== 1) return;
        const touch = e.touches[0];
        const startX = touch.clientX - pan.x;
        const startY = touch.clientY - pan.y;

        const handleTouchMove = (moveEvent) => {
            if (moveEvent.touches.length !== 1) return;
            const moveTouch = moveEvent.touches[0];
            setPan({
                x: moveTouch.clientX - startX,
                y: moveTouch.clientY - startY,
            });
        };

        const handleTouchEnd = () => {
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
        };

        document.addEventListener('touchmove', handleTouchMove);
        document.addEventListener('touchend', handleTouchEnd);
    };

    // Transform actions
    const rotateLeft = () => setRotation((r) => (r - 90 + 360) % 360);
    const rotateRight = () => setRotation((r) => (r + 90) % 360);
    const toggleFlipH = () => setFlipH((f) => !f);
    const toggleFlipV = () => setFlipV((f) => !f);
    const resetTransformations = () => {
        setZoom(1);
        setRotation(0);
        setFlipH(false);
        setFlipV(false);
        setPan({ x: 0, y: 0 });
    };

    const saveCroppedImage = () => {
        if (!imageRef.current) return null;
        const croppedUrl = generateCroppedAvatar({
            imageEl: imageRef.current,
            cutoutSize,
            baseScale,
            zoom,
            rotation,
            flipH,
            flipV,
            pan,
        });
        closeEditor();
        return croppedUrl;
    };

    return {
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
    };
}
