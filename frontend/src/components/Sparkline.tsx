import { niceCeiling } from "../lib/scale";

// Inset so the end-dot and its surface ring are not clipped by the viewBox.
const INSET = 6;

// Trend line for a stat tile: prior points recede, the latest reads in accent.
export function Sparkline({ values, width = 120, height = 32 }: { values: number[]; width?: number; height?: number }) {
    if (values.length < 2) return null;
    const top = niceCeiling(Math.max(...values)) || 1;
    const step = (width - INSET * 2) / (values.length - 1);
    const y = (value: number) => height - INSET - ((height - INSET * 2) * value) / top;
    const path = values
        .map((value, i) => `${i ? "L" : "M"}${(INSET + i * step).toFixed(2)},${y(value).toFixed(2)}`)
        .join(" ");

    return (
        <svg className="sparkline" width={width} height={height} aria-hidden="true">
            <path className="sparkline-path" d={path} />
            <circle className="sparkline-dot" cx={width - INSET} cy={y(values[values.length - 1])} r={3.5} />
        </svg>
    );
}
