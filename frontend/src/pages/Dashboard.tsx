import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getActivity, getAsteroidViews, getStats } from "../api/asteroids";
import type { Asteroid, AsteroidView, DashboardStats } from "../api/types";
import { useAsync } from "../hooks/useAsync";
import { ActivityTimeline } from "../components/ActivityTimeline";
import { AwaitingApi } from "../components/AwaitingApi";
import { DataTable, type Column } from "../components/DataTable";
import { Panel } from "../components/Panel";
import { StatTile } from "../components/StatTile";
import { StatusPill } from "../components/StatusPill";
import { TimeSlider } from "../components/TimeSlider";
import { DASH, distanceKm, integer, shortDate } from "../lib/format";
import { torinoBand } from "../lib/risk";

const DAY_MS = 86_400_000;

export function Dashboard({ asteroids }: { asteroids: Asteroid[] }) {
    const navigate = useNavigate();
    const [daysBack, setDaysBack] = useState(0);

    const stats = useAsync(getStats, []);
    const views = useAsync(getAsteroidViews, []);
    // Snapped to day boundaries so the window is stable across renders — a raw
    // Date.now() here changes every render and refetches forever.
    const { since, until } = useMemo(() => {
        const end = new Date();
        end.setHours(23, 59, 59, 999);
        return {
            until: new Date(end.getTime() - daysBack * DAY_MS).toISOString(),
            since: new Date(end.getTime() - (daysBack + 1) * DAY_MS).toISOString(),
        };
    }, [daysBack]);
    const activity = useAsync(() => getActivity(since, until), [since, until]);

    // /stats is unwritten, so fall back to counting the list we already hold.
    // Upcoming approaches needs close_approach and has no client-side source.
    const derived: DashboardStats | null = useMemo(() => {
        if (!asteroids.length) return null;
        return {
            neoCount: asteroids.length,
            hazardousCount: asteroids.filter((a) => a.isPotentiallyHazardous).length,
            sentryCount: asteroids.filter((a) => a.isSentryObject).length,
            upcomingApproaches: Number.NaN,
        };
    }, [asteroids]);

    const counts = stats.status === "ready" ? stats.data : derived;
    const approachesKnown = stats.status === "ready";

    const rows: AsteroidView[] =
        views.status === "ready"
            ? views.data
            : asteroids.map((a) => ({ ...a, nextApproach: null, risk: null }));

    return (
        <>
            <section className="tiles" aria-label="Fleet summary">
                <StatTile
                    hero
                    label="Tracked NEOs"
                    value={counts ? integer(counts.neoCount) : DASH}
                    note="near-Earth objects in the store"
                />
                <StatTile
                    label="Potentially hazardous"
                    value={counts ? integer(counts.hazardousCount) : DASH}
                    note={counts ? `${percent(counts.hazardousCount, counts.neoCount)} of tracked` : undefined}
                />
                <StatTile
                    label="Sentry objects"
                    value={counts ? integer(counts.sentryCount) : DASH}
                    note="under impact monitoring"
                />
                <StatTile
                    label="Upcoming approaches"
                    value={approachesKnown ? integer(counts?.upcomingApproaches) : DASH}
                    note={approachesKnown ? "next 30 days" : "awaiting GET /api/stats"}
                    pending={!approachesKnown}
                />
            </section>

            <Panel
                title="Asteroid activity"
                aside={<span className="panel-count">{windowLabel(daysBack)}</span>}
            >
                {activity.status === "loading" && <p className="table-empty">Loading activity…</p>}
                {activity.status === "failed" && (
                    <AwaitingApi
                        error={activity.error}
                        what="The activity feed reads change events from sentry_risk_history and close_approach."
                        height={180}
                    />
                )}
                {activity.status === "ready" && <ActivityTimeline events={activity.data} />}

                <TimeSlider
                    days={daysBack}
                    onChange={setDaysBack}
                    disabled={activity.status === "failed"}
                />
            </Panel>

            <Panel title="Asteroids" aside={<span className="panel-count">{rows.length} tracked</span>}>
                {views.status === "failed" && (
                    <p className="panel-hint">
                        Showing identity and size only — risk, Torino and approach columns fill in
                        once <code>GET /api/asteroid-views</code> lands.
                    </p>
                )}
                <DataTable
                    columns={columns}
                    rows={rows}
                    rowKey={(row) => row.spkId}
                    onRowClick={(row) => navigate(`/asteroids/${encodeURIComponent(row.designation)}`)}
                    caption="Tracked asteroids with risk and next close approach"
                    empty="No asteroids stored yet — run the worker to poll NeoWs."
                />
            </Panel>
        </>
    );
}

const percent = (part: number, total: number) =>
    total > 0 ? `${((part / total) * 100).toFixed(1)}%` : DASH;

const windowLabel = (daysBack: number) =>
    daysBack === 0 ? "Last 24 hours" : `${daysBack} day${daysBack === 1 ? "" : "s"} ago`;

const columns: Column<AsteroidView>[] = [
    {
        key: "designation",
        header: "Designation",
        compare: (a, b) => a.designation.localeCompare(b.designation),
        render: (row) => (
            <span className="cell-name">
                <span className="cell-title">
                    <strong>{row.designation}</strong>
                    {row.isPotentiallyHazardous && (
                        <span className="tag tag-warning" title="Potentially hazardous asteroid">PHA</span>
                    )}
                </span>
                <span className="cell-sub">{row.fullName}</span>
            </span>
        ),
    },
    {
        key: "risk",
        header: "Risk",
        compare: (a, b) =>
            (a.risk?.impactProbability ?? -1) - (b.risk?.impactProbability ?? -1),
        render: (row) =>
            row.risk ? (
                <StatusPill band={torinoBand(row.risk.torinoScaleMax)} size="sm" />
            ) : (
                <span className="cell-sub">Not monitored</span>
            ),
    },
    {
        key: "torino",
        header: "Torino",
        align: "right",
        compare: (a, b) => (a.risk?.torinoScaleMax ?? -1) - (b.risk?.torinoScaleMax ?? -1),
        render: (row) => (row.risk?.torinoScaleMax ?? DASH),
    },
    {
        key: "diameter",
        header: "Diameter",
        align: "right",
        compare: (a, b) => a.diameterMaxM - b.diameterMaxM,
        render: (row) => `${Math.round(row.diameterMaxM).toLocaleString()} m`,
    },
    {
        key: "approach",
        header: "Next approach",
        align: "right",
        compare: (a, b) =>
            Date.parse(a.nextApproach?.approachAt ?? "9999-12-31") -
            Date.parse(b.nextApproach?.approachAt ?? "9999-12-31"),
        render: (row) => shortDate(row.nextApproach?.approachAt),
    },
    {
        key: "distance",
        header: "Miss distance",
        align: "right",
        compare: (a, b) =>
            (a.nextApproach?.missDistanceKm ?? Infinity) - (b.nextApproach?.missDistanceKm ?? Infinity),
        render: (row) => distanceKm(row.nextApproach?.missDistanceKm),
    },
];

