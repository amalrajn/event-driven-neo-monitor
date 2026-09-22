import type { ReactNode } from "react";
import { Sparkline } from "./Sparkline";

interface StatTileProps {
    label: string;
    value: ReactNode;
    note?: ReactNode;
    trend?: number[];
    hero?: boolean;
    pending?: boolean;
}

export function StatTile({ label, value, note, trend, hero, pending }: StatTileProps) {
    return (
        <div className={`tile${hero ? " tile-hero" : ""}${pending ? " tile-pending" : ""}`}>
            <p className="tile-label">{label}</p>
            <p className="tile-value">{value}</p>
            {note && <p className="tile-note">{note}</p>}
            {trend && trend.length > 1 && <Sparkline values={trend} />}
        </div>
    );
}
