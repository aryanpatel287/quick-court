import {
    ZoomIn,
    ZoomOut,
    RotateCcw,
    RotateCw,
    FlipHorizontal,
    FlipVertical,
    RefreshCw,
} from 'lucide-react';

export default function AvatarEditorControls({
    zoom,
    setZoom,
    rotateLeft,
    rotateRight,
    toggleFlipH,
    toggleFlipV,
    resetTransformations,
}) {
    return (
        <div className="editor-controls-panel">
            {/* Zoom Slider */}
            <div className="control-group zoom-group">
                <span className="control-label">Zoom</span>
                <div className="slider-container">
                    <button
                        type="button"
                        className="slider-adj-btn"
                        onClick={() => setZoom((z) => Math.max(1, z - 0.1))}
                    >
                        <ZoomOut size={16} />
                    </button>
                    <input
                        type="range"
                        min="1"
                        max="3"
                        step="0.01"
                        value={zoom}
                        className="zoom-slider-range"
                        onChange={(e) => setZoom(parseFloat(e.target.value))}
                    />
                    <button
                        type="button"
                        className="slider-adj-btn"
                        onClick={() => setZoom((z) => Math.min(3, z + 0.1))}
                    >
                        <ZoomIn size={16} />
                    </button>
                </div>
                <span className="zoom-percentage-text">{Math.round(zoom * 100)}%</span>
            </div>

            {/* Transform Controls Button Row */}
            <div className="control-group-buttons">
                {/* Rotate Group */}
                <div className="button-sub-group">
                    <button
                        type="button"
                        className="transform-btn"
                        onClick={rotateLeft}
                        title="Rotate 90° Left"
                    >
                        <RotateCcw size={16} />
                        <span>Rotate L</span>
                    </button>
                    <button
                        type="button"
                        className="transform-btn"
                        onClick={rotateRight}
                        title="Rotate 90° Right"
                    >
                        <RotateCw size={16} />
                        <span>Rotate R</span>
                    </button>
                </div>

                {/* Mirror Group */}
                <div className="button-sub-group">
                    <button
                        type="button"
                        className="transform-btn"
                        onClick={toggleFlipH}
                        title="Flip Horizontal"
                    >
                        <FlipHorizontal size={16} />
                        <span>Flip H</span>
                    </button>
                    <button
                        type="button"
                        className="transform-btn"
                        onClick={toggleFlipV}
                        title="Flip Vertical"
                    >
                        <FlipVertical size={16} />
                        <span>Flip V</span>
                    </button>
                </div>

                {/* Reset transform state */}
                <button
                    type="button"
                    className="transform-btn reset-btn"
                    onClick={resetTransformations}
                    title="Reset Changes"
                >
                    <RefreshCw size={14} />
                    <span>Reset</span>
                </button>
            </div>
        </div>
    );
}
