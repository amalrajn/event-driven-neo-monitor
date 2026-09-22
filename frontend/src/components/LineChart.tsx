import { useMemo, useState } from "react";
import { useMeasure } from "../hooks/useMeasure";
import { linearTicks, niceCeiling } from "../lib/scale";
import { shortDate } from "../lib/format";

export interface LinePoint {
    at: string;
    value: number;
}

interface LineChartProps {
    points: LinePoint[];
    seriesLabel: string;
    formatValue: (value: number) => string;
    formatTick?: (value: number) => string;
    height?: number;
}

const PAD = { top: 22, right: 18, bottom: 30, left: 58 };
const X_TICKS = 4;
const MIN_PLOT = 120;

// Up to X_TICKS evenly spaced points, deduped so a short series does not
// repeat the same date twice.
function xTickIndexes(count: number): number[] {
    if (count <= X_TICKS) return Array.from({ length: count }, (_, i) => i);
    const step = (count - 1) / (X_TICKS - 1);
    return [...new Set(Array.from({ length: X_TICKS }, (_, i) => Math.round(i * step)))];
}

export function LineChart({
    points,
    seriesLabel,
    formatValue,
    formatTick = formatValue,
    height = 240,
}: LineChartProps) {
    const [wrapRef, width] = useMeasure<HTMLDivElement>();
    const [active, setActive] = useState<number | null>(null);

    const sorted = useMemo(
        () => [...points].sort((a, b) => Date.parse(a.at) - Date.parse(b.at)),
        [points],
    );

    const plotWidth = Math.max(width - PAD.left - PAD.right, MIN_PLOT);
    const plotHeight = Math.max(height - PAD.top - PAD.bottom, MIN_PLOT);

    const geometry = useMemo(() => {
        if (!sorted.length) return null;
        const times = sorted.map((p) => Date.parse(p.at));
        const [t0, t1] = [Math.min(...times), Math.max(...times)];
        const span = t1 - t0 || 1;
        const top = niceCeiling(Math.max(...sorted.map((p) => p.value))) || 1;

        const x = (i: number) => (plotWidth * (times[i] - t0)) / span;
        const y = (value: number) => plotHeight - (plotHeight * value) / top;

        const coords = sorted.map((p, i) => ({ x: x(i), y: y(p.value), point: p }));
        const line = coords.map((c, i) => `${i ? "L" : "M"}${c.x.toFixed(2)},${c.y.toFixed(2)}`).join(" ");
        const area = `${line} L${coords[coords.length - 1].x.toFixed(2)},${plotHeight} L${coords[0].x.toFixed(2)},${plotHeight} Z`;
        return { coords, line, area, top, ticks: linearTicks(top) };
    }, [sorted, plotWidth, plotHeight]);

    if (!geometry) return null;

    const { coords, line, area, top, ticks } = geometry;
    const last = coords[coords.length - 1];
    const hovered = active != null ? coords[active] : null;

    function pick(clientX: number, target: SVGSVGElement) {
        const box = target.getBoundingClientRect();
        const local = clientX - box.left - PAD.left;
        let nearest = 0;
        for (let i = 1; i < coords.length; i++) {
            if (Math.abs(coords[i].x - local) < Math.abs(coords[nearest].x - local)) nearest = i;
        }
        setActive(nearest);
    }

    function onKeyDown(event: React.KeyboardEvent) {
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
        event.preventDefault();
        const step = event.key === "ArrowRight" ? 1 : -1;
        const from = active ?? (step > 0 ? -1 : coords.length);
        setActive(Math.min(coords.length - 1, Math.max(0, from + step)));
    }

    return (
        <div className="chart" ref={wrapRef}>
            <svg
                width="100%"
                height={height}
                role="img"
                aria-label={`${seriesLabel} over time`}
                tabIndex={0}
                onMouseMove={(event) => pick(event.clientX, event.currentTarget)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive((current) => current ?? coords.length - 1)}
                onBlur={() => setActive(null)}
                onKeyDown={onKeyDown}
            >
                <text className="axis-title" x={0} y={12}>{seriesLabel}</text>
                <g transform={`translate(${PAD.left},${PAD.top})`}>
                    {ticks.map((tick) => {
                        const y = plotHeight - (plotHeight * tick) / top;
                        return (
                            <g key={tick}>
                                <line className="grid" x1={0} x2={plotWidth} y1={y} y2={y} />
                                <text className="axis-text" x={-10} y={y} dy="0.32em" textAnchor="end">
                                    {formatTick(tick)}
                                </text>
                            </g>
                        );
                    })}

                    <path className="area" d={area} />
                    <path className="line" d={line} />

                    {hovered && (
                        <line className="crosshair" x1={hovered.x} x2={hovered.x} y1={0} y2={plotHeight} />
                    )}

                    <circle className="end-dot" cx={last.x} cy={last.y} r={5} />
                    {hovered && hovered !== last && (
                        <circle className="end-dot" cx={hovered.x} cy={hovered.y} r={5} />
                    )}

                    <line className="baseline" x1={0} x2={plotWidth} y1={plotHeight} y2={plotHeight} />
                    {xTickIndexes(coords.length).map((index, slot, all) => (
                        <text
                            key={index}
                            className="axis-text"
                            x={coords[index].x}
                            y={plotHeight + 18}
                            textAnchor={slot === 0 ? "start" : slot === all.length - 1 ? "end" : "middle"}
                        >
                            {shortDate(coords[index].point.at)}
                        </text>
                    ))}
                </g>
            </svg>

            {hovered && (
                <div
                    className="tooltip"
                    style={{
                        left: Math.min(Math.max(hovered.x + PAD.left, 70), Math.max(width - 70, 70)),
                        top: hovered.y + PAD.top,
                    }}
                >
                    <span className="tooltip-date">{shortDate(hovered.point.at)}</span>
                    <span className="tooltip-value">
                        <i className="key" aria-hidden="true" />
                        {seriesLabel} {formatValue(hovered.point.value)}
                    </span>
                </div>
            )}
        </div>
    );
}
