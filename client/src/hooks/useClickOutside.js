import { useEffect } from 'react';

/**
 * Custom hook to handle clicks outside of specified element(s).
 *
 * @param {React.RefObject | Array<React.RefObject>} refs - Single ref or array of refs to watch
 * @param {Function} handler - Callback function invoked on click outside
 * @param {Object} [options]
 * @param {boolean} [options.enabled=true] - Whether listener is active
 * @param {string} [options.eventType='mousedown'] - DOM event type ('mousedown' | 'pointerdown' | 'click')
 * @param {Function} [options.ignoreCondition] - Optional custom condition (event) => boolean; return true to ignore
 */
export function useClickOutside(
    refs,
    handler,
    { enabled = true, eventType = 'mousedown', ignoreCondition } = {},
) {
    useEffect(() => {
        if (!enabled) return;

        const handleClickOutside = (event) => {
            if (!handler) return;

            if (ignoreCondition && ignoreCondition(event)) {
                return;
            }

            const refArray = Array.isArray(refs) ? refs : [refs];

            const isInside = refArray.some((ref) => {
                const el = ref && typeof ref === 'object' && 'current' in ref ? ref.current : ref;
                return el && el.contains(event.target);
            });

            if (!isInside) {
                handler(event);
            }
        };

        document.addEventListener(eventType, handleClickOutside);
        return () => {
            document.removeEventListener(eventType, handleClickOutside);
        };
    }, [refs, handler, enabled, eventType, ignoreCondition]);
}

export default useClickOutside;
