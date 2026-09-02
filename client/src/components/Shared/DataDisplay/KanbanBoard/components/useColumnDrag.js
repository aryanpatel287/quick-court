import { useState, useRef } from 'react';

export function useColumnDrag({ columnId, onDropCard, onCardDragStart }) {
    const [isDragOver, setIsDragOver] = useState(false);
    const dragCounterRef = useRef(0);

    const handleDragEnter = (e) => {
        e.preventDefault();
        dragCounterRef.current += 1;
        if (dragCounterRef.current > 0) setIsDragOver(true);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (!isDragOver) setIsDragOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        dragCounterRef.current -= 1;
        if (dragCounterRef.current <= 0) {
            dragCounterRef.current = 0;
            setIsDragOver(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        dragCounterRef.current = 0;
        setIsDragOver(false);
        const cardDataStr = e.dataTransfer.getData('text/plain');
        if (cardDataStr) {
            try {
                const cardItem = JSON.parse(cardDataStr);
                if (onDropCard) onDropCard(cardItem, columnId);
            } catch (err) {
                console.error('Failed to parse drag item:', err);
            }
        }
    };

    const handleDragStart = (e, cardItem) => {
        e.dataTransfer.setData('text/plain', JSON.stringify(cardItem));
        if (onCardDragStart) onCardDragStart(cardItem);
    };

    return {
        isDragOver,
        handleDragEnter,
        handleDragOver,
        handleDragLeave,
        handleDrop,
        handleDragStart,
    };
}
