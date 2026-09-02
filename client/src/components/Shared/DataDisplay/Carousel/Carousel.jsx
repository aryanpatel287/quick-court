import * as React from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Button from '@/components/Shared/Buttons/Button/Button';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import './Carousel.scss';

const CarouselContext = React.createContext(null);

function useCarousel() {
    const context = React.useContext(CarouselContext);
    if (!context) {
        throw new Error('useCarousel must be used within a <Carousel />');
    }
    return context;
}

export function Carousel({
    orientation = 'horizontal',
    opts,
    setApi,
    plugins,
    className = '',
    children,
    ...props
}) {
    const [carouselRef, api] = useEmblaCarousel(
        {
            ...opts,
            axis: orientation === 'horizontal' ? 'x' : 'y',
        },
        plugins,
    );
    const [canScrollPrev, setCanScrollPrev] = React.useState(false);
    const [canScrollNext, setCanScrollNext] = React.useState(false);

    const onSelect = React.useCallback((api) => {
        if (!api) return;
        setCanScrollPrev(api.canScrollPrev());
        setCanScrollNext(api.canScrollNext());
    }, []);

    const scrollPrev = React.useCallback(() => {
        api?.scrollPrev();
    }, [api]);

    const scrollNext = React.useCallback(() => {
        api?.scrollNext();
    }, [api]);

    const handleKeyDown = React.useCallback(
        (event) => {
            if (event.key === 'ArrowLeft') {
                event.preventDefault();
                scrollPrev();
            } else if (event.key === 'ArrowRight') {
                event.preventDefault();
                scrollNext();
            }
        },
        [scrollPrev, scrollNext],
    );

    React.useEffect(() => {
        if (!api || !setApi) return;
        setApi(api);
    }, [api, setApi]);

    React.useEffect(() => {
        if (!api) return;
        const timeoutId = setTimeout(() => onSelect(api), 0);
        api.on('reInit', onSelect);
        api.on('select', onSelect);

        return () => {
            clearTimeout(timeoutId);
            api?.off('select', onSelect);
        };
    }, [api, onSelect]);

    return (
        <CarouselContext.Provider
            value={{
                carouselRef,
                api: api,
                opts,
                orientation: orientation || (opts?.axis === 'y' ? 'vertical' : 'horizontal'),
                scrollPrev,
                scrollNext,
                canScrollPrev,
                canScrollNext,
            }}
        >
            <div
                onKeyDownCapture={handleKeyDown}
                className={`shared-carousel ${className}`}
                role="region"
                aria-roledescription="carousel"
                {...props}
            >
                {children}
            </div>
        </CarouselContext.Provider>
    );
}

export function CarouselContent({ className = '', ...props }) {
    const { carouselRef, orientation } = useCarousel();

    return (
        <div ref={carouselRef} className="shared-carousel-content-viewport">
            <div
                className={`shared-carousel-content-track ${orientation === 'horizontal' ? 'axis-x' : 'axis-y'} ${className}`}
                {...props}
            />
        </div>
    );
}

export function CarouselItem({ className = '', ...props }) {
    const { orientation } = useCarousel();

    return (
        <div
            role="group"
            aria-roledescription="slide"
            className={`shared-carousel-item ${orientation === 'horizontal' ? 'axis-x' : 'axis-y'} ${className}`}
            {...props}
        />
    );
}

export function CarouselPrevious({
    className = '',
    variant = 'outline',
    size = 'icon-sm',
    ...props
}) {
    const { orientation, scrollPrev, canScrollPrev } = useCarousel();

    return (
        <Button
            variant={variant}
            size={size}
            className={`shared-carousel-previous ${orientation === 'horizontal' ? 'axis-x' : 'axis-y'} ${className}`}
            disabled={!canScrollPrev}
            onClick={scrollPrev}
            {...props}
        >
            <ChevronLeftIcon size={16} />
            <span className="sr-only">Previous slide</span>
        </Button>
    );
}

export function CarouselNext({ className = '', variant = 'outline', size = 'icon-sm', ...props }) {
    const { orientation, scrollNext, canScrollNext } = useCarousel();

    return (
        <Button
            variant={variant}
            size={size}
            className={`shared-carousel-next ${orientation === 'horizontal' ? 'axis-x' : 'axis-y'} ${className}`}
            disabled={!canScrollNext}
            onClick={scrollNext}
            {...props}
        >
            <ChevronRightIcon size={16} />
            <span className="sr-only">Next slide</span>
        </Button>
    );
}
