export default function AvatarEditorCanvas({
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
}) {
    return (
        <div
            className="crop-workspace-container"
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            style={{
                '--workspace-height': '320px',
                '--cutout-size': `${cutoutSize}px`,
            }}
        >
            <img
                ref={imageRef}
                src={imageSrc}
                alt="Workspace Source"
                className="crop-workspace-img"
                onLoad={handleImageLoad}
                style={{
                    width: `${displaySize.width}px`,
                    height: `${displaySize.height}px`,
                    transform: `translate(-50%, -50%) translate(${pan.x}px, ${pan.y}px) rotate(${rotation}deg) scale(${zoom}) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
                }}
            />
            {/* Cutout Mask overlay with transparent circle center */}
            <div className="crop-mask-cutout shape-circle" />

            {/* Aspect helper lines overlay */}
            <div className="crop-mask-borders shape-circle" />
        </div>
    );
}
