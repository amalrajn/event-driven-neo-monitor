import { request } from "./client";
import type {
    ActivityEvent,
    Asteroid,
    AsteroidView,
    CloseApproach,
    DashboardStats,
    RiskHistoryPoint,
    SentryRisk,
} from "./types";

const seg = (designation: string) => encodeURIComponent(designation.trim());

/* -- live: backed by backend/src/routes/asteroid.routes.ts ----------------- */

export const getAsteroids = () => request<Asteroid[]>("/asteroids");

export const getAsteroid = (designation: string) =>
    request<Asteroid>(`/asteroids/${seg(designation)}`);

export const getAsteroidHistory = (designation: string) =>
    request<Asteroid[]>(`/asteroids/${seg(designation)}/history`);

/* -- planned: no route yet, so these reject with kind "missing-endpoint"
      and the UI renders an "Awaiting API" panel in their place ------------- */

export const getStats = () => request<DashboardStats>("/stats");

export const getActivity = (since?: string, until?: string) => {
    const query = new URLSearchParams();
    if (since) query.set("since", since);
    if (until) query.set("until", until);
    const suffix = query.size ? `?${query}` : "";
    return request<ActivityEvent[]>(`/activity${suffix}`);
};

// Deliberately not "/asteroids/views": that would be swallowed by the existing
// GET /asteroids/:designation route and 404 as a missing asteroid.
export const getAsteroidViews = () => request<AsteroidView[]>("/asteroid-views");

export const getApproaches = (designation: string) =>
    request<CloseApproach[]>(`/asteroids/${seg(designation)}/approaches`);

export const getRisk = (designation: string) =>
    request<SentryRisk>(`/asteroids/${seg(designation)}/risk`);

export const getRiskHistory = (designation: string) =>
    request<RiskHistoryPoint[]>(`/asteroids/${seg(designation)}/risk-history`);
