const NBSP = " ";

export const DASH = "—";

export function compactNumber(value: number): string {
    if (!Number.isFinite(value)) return DASH;
    if (Math.abs(value) < 1000) return value.toLocaleString();
    return value.toLocaleString(undefined, { notation: "compact", maximumFractionDigits: 1 });
}

export function integer(value: number | null | undefined): string {
    return value == null || !Number.isFinite(value) ? DASH : value.toLocaleString();
}

// 1_240_000 -> "1.24M km"; small distances stay whole, e.g. "820 km".
export function distanceKm(km: number | null | undefined): string {
    if (km == null || !Number.isFinite(km)) return DASH;
    if (km >= 1e6) return `${(km / 1e6).toFixed(2)}M${NBSP}km`;
    if (km >= 1e3) return `${Math.round(km / 1e3).toLocaleString()}K${NBSP}km`;
    return `${Math.round(km).toLocaleString()}${NBSP}km`;
}

export const lunar = (ld: number | null | undefined) =>
    ld == null || !Number.isFinite(ld) ? DASH : `${ld.toFixed(1)} LD`;

export const velocity = (kms: number | null | undefined) =>
    kms == null || !Number.isFinite(kms) ? DASH : `${kms.toFixed(1)}${NBSP}km/s`;

export const meters = (m: number | null | undefined) =>
    m == null || !Number.isFinite(m) ? DASH : `${Math.round(m).toLocaleString()}${NBSP}m`;

export function diameterRange(minM: number, maxM: number): string {
    if (!Number.isFinite(minM) || !Number.isFinite(maxM)) return DASH;
    return `${Math.round(minM).toLocaleString()}–${Math.round(maxM).toLocaleString()}${NBSP}m`;
}

// 0.0000012 -> "0.00012%". Only genuinely tiny odds fall back to "1 in N",
// where a percentage would be all leading zeroes.
export function probability(p: number | null | undefined): string {
    if (p == null || !Number.isFinite(p)) return DASH;
    if (p === 0) return "0%";
    const pct = p * 100;
    if (pct >= 1) return `${pct.toFixed(1)}%`;
    if (pct >= 1e-5) return `${Number(pct.toPrecision(2))}%`;
    return `1 in ${compactNumber(Math.round(1 / p))}`;
}

// Axis form of the same value: uniform and short, e.g. "1.5e-6". "1 in N" is
// unusable on an axis because it inverts as the scale climbs.
export function probabilityTick(p: number): string {
    if (!Number.isFinite(p) || p === 0) return "0";
    const exponent = Math.floor(Math.log10(p));
    const mantissa = p / 10 ** exponent;
    return `${Number(mantissa.toFixed(1))}e${exponent}`;
}

const DATE = new Intl.DateTimeFormat(undefined, { month: "short", day: "2-digit" });
const DATE_YEAR = new Intl.DateTimeFormat(undefined, { month: "short", day: "2-digit", year: "numeric" });
const TIME = new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" });

const parse = (iso: string | null | undefined) => {
    if (!iso) return null;
    const date = new Date(iso);
    return Number.isNaN(date.getTime()) ? null : date;
};

export const shortDate = (iso: string | null | undefined) => {
    const date = parse(iso);
    return date ? DATE.format(date) : DASH;
};

export const fullDate = (iso: string | null | undefined) => {
    const date = parse(iso);
    return date ? DATE_YEAR.format(date) : DASH;
};

export const clockTime = (iso: string | null | undefined) => {
    const date = parse(iso);
    return date ? TIME.format(date) : DASH;
};

export const toDate = parse;
