import type { TorinoScale } from "../api/types";

export type StatusTone = "neutral" | "good" | "warning" | "serious" | "critical";

export interface TorinoBand {
    tone: StatusTone;
    label: string;
    icon: string;
}

// The five official Torino bands. Every tone ships with its label and icon so
// severity is never carried by color alone.
export function torinoBand(value: TorinoScale | null | undefined): TorinoBand {
    if (value == null) return { tone: "neutral", label: "Unrated", icon: "○" };
    if (value === 0) return { tone: "good", label: "No hazard", icon: "✓" };
    if (value === 1) return { tone: "good", label: "Normal", icon: "✓" };
    if (value <= 4) return { tone: "warning", label: "Meriting attention", icon: "!" };
    if (value <= 7) return { tone: "serious", label: "Threatening", icon: "▲" };
    return { tone: "critical", label: "Certain collision", icon: "■" };
}

export function hazardBand(isHazardous: boolean): TorinoBand {
    return isHazardous
        ? { tone: "warning", label: "Yes", icon: "!" }
        : { tone: "good", label: "No", icon: "✓" };
}
