import React from 'react';
import './StepProgress.scss';

function StepProgress({
    steps = ['Assign Client', 'Assign ID', 'Attach Contact'],
    currentStep = 2,
    onStepClick = null,
    variant = 'blue', // 'blue' | 'primary' | 'teal' | 'emerald' | 'purple' | 'indigo'
    size = 'medium', // 'small' | 'medium' | 'large'
    className = '',
    style = {},
    ...restProps
}) {
    const stepList =
        Array.isArray(steps) && steps.length > 0
            ? steps
            : ['Assign Client', 'Assign ID', 'Attach Contact'];
    const activeIdx = Math.max(0, currentStep - 1);

    const variantClass = `stepprogress-variant-${variant}`;
    const sizeClass = `stepprogress-size-${size}`;

    const handleStepClick = (idx, stepItem) => {
        if (typeof onStepClick === 'function') {
            onStepClick(idx + 1, stepItem);
        }
    };

    return (
        <div
            className={`stepprogress-component-container ${variantClass} ${sizeClass} ${className}`}
            style={style}
            {...restProps}
        >
            <div className="stepprogress-track-container">
                {stepList.map((stepItem, idx) => {
                    const stepNumber = idx + 1;
                    const isCompleted = idx < activeIdx;
                    const isActive = idx === activeIdx;
                    const isPending = idx > activeIdx;

                    const label =
                        typeof stepItem === 'object' ? stepItem.label || stepItem.title : stepItem;
                    const description = typeof stepItem === 'object' ? stepItem.description : null;

                    // Connector line before step node
                    const hasPrevLine = idx > 0;
                    const isPrevLineActive = idx <= activeIdx;

                    // Connector line after step node
                    const hasNextLine = idx < stepList.length - 1;
                    const isNextLineActive = idx < activeIdx;

                    let stateClass = 'pending';
                    if (isCompleted) stateClass = 'completed';
                    if (isActive) stateClass = 'active';

                    return (
                        <React.Fragment key={idx}>
                            {/* Connector line segment */}
                            {hasPrevLine && (
                                <div
                                    className={`stepprogress-connector-line ${isPrevLineActive ? 'active' : 'inactive'}`}
                                />
                            )}

                            {/* Step Node & Label Stack */}
                            <div
                                className={`stepprogress-node-wrapper ${stateClass} ${onStepClick ? 'is-clickable' : ''}`}
                                onClick={() => handleStepClick(idx, stepItem)}
                            >
                                {/* Circle Node Icon */}
                                <div className="stepprogress-node-circle">
                                    {isCompleted ? (
                                        <svg
                                            className="stepprogress-check-icon"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="3.2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    ) : (
                                        <span className="stepprogress-step-num">{stepNumber}</span>
                                    )}
                                </div>

                                {/* Label text below node */}
                                <div className="stepprogress-label-stack">
                                    <span className="stepprogress-label">{label}</span>
                                    {description && (
                                        <span className="stepprogress-description">
                                            {description}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
}

export default StepProgress;
