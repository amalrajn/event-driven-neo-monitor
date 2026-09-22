import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getApproaches, getAsteroid, getRisk, getRiskHistory } from "../api/asteroids";
import type { CloseApproach } from "../api/types";
import { useAsync } from "../hooks/useAsync";
import { AwaitingApi } from "../components/AwaitingApi";
import { DataTable, type Column } from "../components/DataTable";
import { LineChart } from "../components/LineChart";
import { Panel } from "../components/Panel";
import { Sparkline } from "../components/Sparkline";
import { StatTile } from "../components/StatTile";
import { StatusPill } from "../components/StatusPill";
import { TorinoMeter } from "../components/TorinoMeter";
import {
    DASH,
    diameterRange,
    distanceKm,
    fullDate,
    lunar,
    probability,
    probabilityTick,
    shortDate,
    velocity,
} from "../lib/format";
import { hazardBand } from "../lib/risk";

export function AsteroidDetail() {
    const { designation = "" } = useParams();
    const [riskView, setRiskView] = useState<"chart" | "table">("chart");

    const asteroid = useAsync(() => getAsteroid(designation), [designation]);
    const approaches = useAsync(() => getApproaches(designation), [designation]);
    const risk = useAsync(() => getRisk(designation), [designation]);
    const riskHistory = useAsync(() => getRiskHistory(designation), [designation]);

    if (asteroid.status === "loading") return <p className="table-empty">Loading {designation}…</p>;

    if (asteroid.status === "failed") {
        return (
            <>
                <BackLink />
                <AwaitingApi error={asteroid.error} what={`No asteroid stored for “${designation}”.`} height={200} />
            </>
        );
    }

    const body = asteroid.data;
    const next = approaches.status === "ready" ? upcoming(approaches.data) : null;
    const current = risk.status === "ready" ? risk.data : null;

    return (
        <>
            <BackLink />

            <div className="detail-head">
                <div>
                    <h1>{body.designation}</h1>
                    <p className="detail-sub">
                        {body.fullName} · SPK-ID {body.spkId}
                        {body.isSentryObject && <span className="tag tag-info">Sentry object</span>}
                    </p>
                </div>
                <a className="jpl-link" href={body.jplUrl} target="_blank" rel="noreferrer">
                    JPL small-body record ↗
                </a>
            </div>

            <section className="tiles tiles-detail" aria-label="Key figures">
                <StatTile
                    label="Diameter"
                    value={diameterRange(body.diameterMinM, body.diameterMaxM)}
                    note={`Absolute magnitude ${body.absoluteMagnitude}`}
                />
                <StatTile
                    label="Next approach"
                    value={next ? fullDate(next.approachAt) : DASH}
                    note={next ? `${velocity(next.velocityKmS)} · ${next.orbitingBody}` : pendingNote(approaches.status)}
                    pending={!next}
                />
                <StatTile
                    label="Miss distance"
                    value={next ? distanceKm(next.missDistanceKm) : DASH}
                    note={next ? lunar(next.missDistanceLunar) : pendingNote(approaches.status)}
                    pending={!next}
                />
            </section>

            <div className="detail-split">
                <div className="card hazard-card">
                    <p className="tile-label">Potentially hazardous</p>
                    <StatusPill band={hazardBand(body.isPotentiallyHazardous)} />
                    <hr className="rule" />
                    {risk.status === "failed" ? (
                        <AwaitingApi error={risk.error} what="Current Sentry rating." />
                    ) : (
                        <TorinoMeter value={current?.torinoScaleMax} />
                    )}
                </div>

                <div className="card">
                    <p className="tile-label">Impact probability</p>
                    {risk.status === "failed" ? (
                        <AwaitingApi
                            error={risk.error}
                            what="Cumulative impact probability comes from the sentry_risk table."
                            height={140}
                        />
                    ) : (
                        <>
                            <div className="probability-head">
                                <p className="tile-value tile-value-lg">{probability(current?.impactProbability)}</p>
                                {riskHistory.status === "ready" && riskHistory.data.length > 1 && (
                                    <Sparkline values={riskHistory.data.map((point) => point.impactProbability)} />
                                )}
                            </div>
                            <dl className="mini-facts">
                                <div>
                                    <dt>Potential impacts</dt>
                                    <dd>{current?.potentialImpacts ?? DASH}</dd>
                                </div>
                                <div>
                                    <dt>Palermo (cum.)</dt>
                                    <dd>{current?.palermoScaleCumulative?.toFixed(2) ?? DASH}</dd>
                                </div>
                                <div>
                                    <dt>Impact window</dt>
                                    <dd>
                                        {current?.impactYearFirst
                                            ? `${current.impactYearFirst}–${current.impactYearLast}`
                                            : DASH}
                                    </dd>
                                </div>
                                <div>
                                    <dt>Energy</dt>
                                    <dd>{current?.impactEnergyMt ? `${current.impactEnergyMt.toFixed(1)} Mt` : DASH}</dd>
                                </div>
                            </dl>
                        </>
                    )}
                </div>
            </div>

            <Panel
                title="Risk history"
                aside={
                    riskHistory.status === "ready" && riskHistory.data.length > 1 ? (
                        <div className="toggle" role="group" aria-label="Risk history view">
                            {(["chart", "table"] as const).map((mode) => (
                                <button
                                    key={mode}
                                    type="button"
                                    className={riskView === mode ? "is-active" : undefined}
                                    aria-pressed={riskView === mode}
                                    onClick={() => setRiskView(mode)}
                                >
                                    {mode === "chart" ? "Chart" : "Table"}
                                </button>
                            ))}
                        </div>
                    ) : undefined
                }
            >
                {riskHistory.status === "loading" && <p className="table-empty">Loading risk history…</p>}
                {riskHistory.status === "failed" && (
                    <AwaitingApi
                        error={riskHistory.error}
                        what="Each point is one observed change in sentry_risk_history."
                        height={200}
                    />
                )}
                {riskHistory.status === "ready" &&
                    (riskHistory.data.length < 2 ? (
                        <p className="table-empty">Not enough observations yet to plot a trend.</p>
                    ) : riskView === "chart" ? (
                        <LineChart
                            points={riskHistory.data.map((p) => ({
                                at: p.observedAt,
                                value: p.impactProbability,
                            }))}
                            seriesLabel="Impact probability"
                            formatValue={probability}
                            formatTick={probabilityTick}
                        />
                    ) : (
                        <DataTable
                            rows={riskHistory.data}
                            rowKey={(row) => row.observedAt}
                            caption="Impact probability by observation date"
                            columns={[
                                { key: "at", header: "Observed", render: (row) => fullDate(row.observedAt) },
                                {
                                    key: "p",
                                    header: "Impact probability",
                                    align: "right",
                                    render: (row) => probability(row.impactProbability),
                                },
                                {
                                    key: "torino",
                                    header: "Torino",
                                    align: "right",
                                    render: (row) => row.torinoScaleMax ?? DASH,
                                },
                                {
                                    key: "palermo",
                                    header: "Palermo",
                                    align: "right",
                                    render: (row) => row.palermoScaleCumulative.toFixed(2),
                                },
                            ]}
                        />
                    ))}
            </Panel>

            <Panel title="Close approaches">
                {approaches.status === "loading" && <p className="table-empty">Loading approaches…</p>}
                {approaches.status === "failed" && (
                    <AwaitingApi
                        error={approaches.error}
                        what="Every logged pass of this object, from the close_approach table."
                        height={180}
                    />
                )}
                {approaches.status === "ready" && (
                    <DataTable
                        columns={approachColumns}
                        rows={approaches.data}
                        rowKey={(row) => row.approachAt}
                        caption="Close approaches by date"
                        empty="No approaches recorded for this object."
                    />
                )}
            </Panel>
        </>
    );
}

function BackLink() {
    return (
        <Link className="back" to="/">
            ← Back to asteroids
        </Link>
    );
}

const pendingNote = (status: string) =>
    status === "loading" ? "Loading…" : "awaiting approach API";

// Earliest approach still in the future; falls back to the most recent pass.
function upcoming(approaches: CloseApproach[]): CloseApproach | null {
    if (!approaches.length) return null;
    const now = Date.now();
    const future = approaches
        .filter((a) => Date.parse(a.approachAt) >= now)
        .sort((a, b) => Date.parse(a.approachAt) - Date.parse(b.approachAt));
    if (future.length) return future[0];
    return [...approaches].sort((a, b) => Date.parse(b.approachAt) - Date.parse(a.approachAt))[0];
}

const approachColumns: Column<CloseApproach>[] = [
    {
        key: "date",
        header: "Date",
        compare: (a, b) => Date.parse(a.approachAt) - Date.parse(b.approachAt),
        render: (row) => (
            <span className="cell-name">
                <strong>{shortDate(row.approachAt)}</strong>
                <span className="cell-sub">{new Date(row.approachAt).getFullYear()}</span>
            </span>
        ),
    },
    {
        key: "distance",
        header: "Miss distance",
        align: "right",
        compare: (a, b) => a.missDistanceKm - b.missDistanceKm,
        render: (row) => distanceKm(row.missDistanceKm),
    },
    {
        key: "lunar",
        header: "Lunar distances",
        align: "right",
        compare: (a, b) => a.missDistanceLunar - b.missDistanceLunar,
        render: (row) => lunar(row.missDistanceLunar),
    },
    {
        key: "velocity",
        header: "Velocity",
        align: "right",
        compare: (a, b) => a.velocityKmS - b.velocityKmS,
        render: (row) => velocity(row.velocityKmS),
    },
    { key: "body", header: "Orbiting", render: (row) => row.orbitingBody },
];
