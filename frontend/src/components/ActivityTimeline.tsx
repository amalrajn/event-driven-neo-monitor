import type { ActivityEvent, ActivityKind } from "../api/types";
import { clockTime, shortDate } from "../lib/format";
import { Link } from "react-router-dom";

const KIND: Record<ActivityKind, { label: string; tone: string }> = {
    discovered: { label: "Discovered", tone: "neutral" },
    "approach-updated": { label: "Approach updated", tone: "info" },
    "risk-changed": { label: "Risk changed", tone: "warning" },
    removed: { label: "Removed from Sentry", tone: "good" },
};

export function ActivityTimeline({ events }: { events: ActivityEvent[] }) {
    if (!events.length) return <p className="table-empty">No activity in this window.</p>;

    return (
        <ol className="timeline">
            {events.map((event) => {
                const kind = KIND[event.kind] ?? { label: event.kind, tone: "neutral" };
                return (
                    <li key={event.id} className="timeline-row">
                        <time className="timeline-time" dateTime={event.occurredAt}>
                            <span className="timeline-clock">{clockTime(event.occurredAt)}</span>
                            <span className="timeline-date">{shortDate(event.occurredAt)}</span>
                        </time>
                        <span className={`timeline-dot dot-${kind.tone}`} aria-hidden="true" />
                        <div className="timeline-body">
                            <p className="timeline-summary">{event.summary}</p>
                            <p className="timeline-meta">
                                <span className={`tag tag-${kind.tone}`}>{kind.label}</span>
                                <Link to={`/asteroids/${encodeURIComponent(event.designation)}`}>
                                    {event.designation}
                                </Link>
                            </p>
                        </div>
                    </li>
                );
            })}
        </ol>
    );
}
