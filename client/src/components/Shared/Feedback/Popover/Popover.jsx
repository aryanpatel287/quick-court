import { Popover as PopoverPrimitive } from '@base-ui/react/popover';
import './Popover.scss';

export function Popover({ ...props }) {
    return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

export function PopoverTrigger({ ...props }) {
    return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
}

export function PopoverContent({
    className = '',
    align = 'center',
    alignOffset = 0,
    side = 'bottom',
    sideOffset = 4,
    ...props
}) {
    return (
        <PopoverPrimitive.Portal>
            <PopoverPrimitive.Positioner
                align={align}
                alignOffset={alignOffset}
                side={side}
                sideOffset={sideOffset}
                className="isolate z-50"
            >
                <PopoverPrimitive.Popup
                    data-slot="popover-content"
                    className={`shared-popover-popup ${className}`}
                    {...props}
                />
            </PopoverPrimitive.Positioner>
        </PopoverPrimitive.Portal>
    );
}
