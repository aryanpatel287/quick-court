import * as React from 'react';

export function useControllableState({ prop, defaultProp, onChange = () => {} }) {
    const [uncontrolledProp, setUncontrolledProp] = React.useState(defaultProp);
    const isControlled = prop !== undefined;
    const value = isControlled ? prop : uncontrolledProp;

    const setValue = React.useCallback(
        (nextValue) => {
            const setter = typeof nextValue === 'function' ? nextValue : () => nextValue;
            if (isControlled) {
                onChange(setter(prop));
            } else {
                setUncontrolledProp(setter(uncontrolledProp));
                onChange(setter(uncontrolledProp));
            }
        },
        [isControlled, prop, uncontrolledProp, onChange],
    );

    return [value, setValue];
}
