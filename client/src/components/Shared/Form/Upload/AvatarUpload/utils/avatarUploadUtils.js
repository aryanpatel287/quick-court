const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Validates uploaded image format and file size.
 */
export function validateImageFile(file) {
    if (!file) return { valid: false };

    if (!ALLOWED_TYPES.includes(file.type)) {
        return {
            valid: false,
            error: 'Unsupported format. Please upload JPEG, PNG, JPG, WEBP, or GIF.',
        };
    }

    if (file.size > MAX_FILE_SIZE) {
        return {
            valid: false,
            error: 'File is too large. Maximum allowed size is 5MB.',
        };
    }

    return { valid: true };
}

/**
 * Derives 1-2 letter uppercase initials from a full name string.
 */
export function getInitials(fullName) {
    if (!fullName) return '';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Renders the transformed image to canvas and outputs a cropped DataURL string.
 */
export function generateCroppedAvatar({
    imageEl,
    cutoutSize = 240,
    baseScale = 1,
    zoom = 1,
    rotation = 0,
    flipH = false,
    flipV = false,
    pan = { x: 0, y: 0 },
    outputSize = 400,
}) {
    if (!imageEl) return null;

    const canvas = document.createElement('canvas');
    canvas.width = outputSize;
    canvas.height = outputSize;
    const ctx = canvas.getContext('2d');

    if (!ctx) return null;

    ctx.clearRect(0, 0, outputSize, outputSize);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const scaleRatio = outputSize / cutoutSize;

    // Center coordinate space
    ctx.translate(outputSize / 2, outputSize / 2);

    // Apply user pan
    ctx.translate(pan.x * scaleRatio, pan.y * scaleRatio);

    // Apply rotation
    ctx.rotate((rotation * Math.PI) / 180);

    // Apply scaling and flips
    const finalScaleX = (flipH ? -1 : 1) * baseScale * zoom * scaleRatio;
    const finalScaleY = (flipV ? -1 : 1) * baseScale * zoom * scaleRatio;
    ctx.scale(finalScaleX, finalScaleY);

    // Draw image centered
    ctx.drawImage(
        imageEl,
        -imageEl.naturalWidth / 2,
        -imageEl.naturalHeight / 2,
        imageEl.naturalWidth,
        imageEl.naturalHeight,
    );

    return canvas.toDataURL('image/jpeg', 0.92);
}
