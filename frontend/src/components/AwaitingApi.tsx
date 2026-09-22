import { ApiError } from "../api/client";

interface AwaitingApiProps {
    error: ApiError;
    what: string;
    height?: number;
}

// Stands in wherever a panel's endpoint is unwritten, unreachable or broken —
// so the page never implies it is showing data it does not have.
export function AwaitingApi({ error, what, height }: AwaitingApiProps) {
    const copy = {
        "missing-endpoint": { mark: "◌", head: "Awaiting API", tone: "pending" },
        offline: { mark: "⚠", head: "API unreachable", tone: "offline" },
        "not-found": { mark: "∅", head: "No data", tone: "empty" },
        error: { mark: "⚠", head: "Request failed", tone: "offline" },
    }[error.kind];

    return (
        <div className={`awaiting awaiting-${copy.tone}`} style={height ? { minHeight: height } : undefined}>
            <span className="awaiting-mark" aria-hidden="true">{copy.mark}</span>
            <p className="awaiting-head">{copy.head}</p>
            <p className="awaiting-body">{what}</p>
            {error.endpoint && <code className="awaiting-endpoint">GET {shortEndpoint(error.endpoint)}</code>}
        </div>
    );
}

// Trims the origin and query so the card shows "/api/activity", not the whole
// URL with percent-encoded timestamps.
const shortEndpoint = (url: string) => url.replace(/^https?:\/\/[^/]+/i, "").replace(/\?.*$/, "");
