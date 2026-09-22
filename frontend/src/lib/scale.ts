export interface Tick {
    value: number;
    offset: number;
}

// Rounds an axis maximum up to 1/2/5 × a power of ten so ticks land on clean
// numbers, e.g. 0.0000037 -> 0.000005.
export function niceCeiling(value: number): number {
    if (!(value > 0)) return 1;
    const magnitude = 10 ** Math.floor(Math.log10(value));
    const normalized = value / magnitude;
    const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
    return step * magnitude;
}

export function linearTicks(max: number, count = 4): number[] {
    const top = niceCeiling(max);
    return Array.from({ length: count + 1 }, (_, i) => (top / count) * i);
}
