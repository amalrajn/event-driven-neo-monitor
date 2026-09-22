// Mirrors backend/src/types/asteroid.ts. Dates arrive as ISO strings over JSON,
// so every `Date` there is a `string` here.

export type SpkId = string;
export type TorinoScale = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface Asteroid {
    spkId: SpkId;
    designation: string;
    fullName: string;
    absoluteMagnitude: number;
    diameterMinM: number;
    diameterMaxM: number;
    isPotentiallyHazardous: boolean;
    isSentryObject: boolean;
    jplUrl: string;
}

export interface CloseApproach {
    spkId: SpkId;
    approachAt: string;
    missDistanceKm: number;
    missDistanceLunar: number;
    velocityKmS: number;
    orbitingBody: string;
}

export interface SentryRisk {
    spkId: SpkId;
    designation: string;
    impactProbability: number;
    potentialImpacts: number;
    palermoScaleCumulative: number;
    palermoScaleMax: number;
    torinoScaleMax: TorinoScale | null;
    diameterM: number | null;
    impactVelocityKmS: number | null;
    impactEnergyMt: number | null;
    impactYearFirst: number | null;
    impactYearLast: number | null;
    lastObservedAt: string | null;
}

// One row of sentry_risk_history: a point on the per-asteroid risk chart.
export interface RiskHistoryPoint {
    designation: string;
    observedAt: string;
    impactProbability: number;
    potentialImpacts: number;
    palermoScaleCumulative: number;
    torinoScaleMax: TorinoScale | null;
    impactEnergyMt: number | null;
}

export type ActivityKind = "discovered" | "approach-updated" | "risk-changed" | "removed";

export interface ActivityEvent {
    id: string;
    occurredAt: string;
    kind: ActivityKind;
    designation: string;
    summary: string;
}

export interface DashboardStats {
    neoCount: number;
    hazardousCount: number;
    sentryCount: number;
    upcomingApproaches: number;
}

// Dashboard table row: an asteroid joined to its next approach and current risk.
export interface AsteroidView extends Asteroid {
    nextApproach: CloseApproach | null;
    risk: SentryRisk | null;
}
