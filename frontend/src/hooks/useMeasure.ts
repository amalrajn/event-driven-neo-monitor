import { useEffect, useRef, useState } from "react";

// Reports the element's content-box width so SVG charts can lay out in real
// pixels instead of scaling a fixed viewBox (which would distort stroke widths).
export function useMeasure<T extends HTMLElement>() {
    const ref = useRef<T | null>(null);
    const [width, setWidth] = useState(0);

    useEffect(() => {
        const node = ref.current;
        if (!node) return;
        const observer = new ResizeObserver(([entry]) => {
            setWidth(entry.contentRect.width);
        });
        observer.observe(node);
        setWidth(node.getBoundingClientRect().width);
        return () => observer.disconnect();
    }, []);

    return [ref, width] as const;
}
