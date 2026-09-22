import type { TorinoBand } from "../lib/risk";

export function StatusPill({ band, size = "md" }: { band: TorinoBand; size?: "sm" | "md" }) {
    return (
        <span className={`pill pill-${band.tone} pill-${size}`}>
            <span className="pill-icon" aria-hidden="true">{band.icon}</span>
            {band.label}
        </span>
    );
}
