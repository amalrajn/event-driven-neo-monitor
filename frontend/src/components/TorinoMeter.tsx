import type { TorinoScale } from "../api/types";
import { torinoBand } from "../lib/risk";
import { StatusPill } from "./StatusPill";

// 0–10 severity meter. The filled steps carry the tone; the track is the same
// ramp a step darker, so the scale reads even at a glance.
export function TorinoMeter({ value }: { value: TorinoScale | null | undefined }) {
    const band = torinoBand(value);
    const filled = value ?? 0;

    return (
        <div className="torino">
            <div className="torino-head">
                <span className="torino-value">{value ?? "—"}</span>
                <StatusPill band={band} size="sm" />
            </div>
            <div
                className={`torino-track tone-${band.tone}`}
                role="meter"
                aria-valuemin={0}
                aria-valuemax={10}
                aria-valuenow={value ?? undefined}
                aria-label={`Torino scale ${value ?? "unrated"}, ${band.label}`}
            >
                {Array.from({ length: 10 }, (_, i) => (
                    <span key={i} className={`torino-step${i < filled ? " is-filled" : ""}`} />
                ))}
            </div>
            <p className="torino-caption">Torino scale · 0 no hazard → 10 certain collision</p>
        </div>
    );
}
