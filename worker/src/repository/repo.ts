import { db } from "../config/db.js";
import type { Asteroid, CloseApproach, SentryRisk } from "../types/asteroid.js";

export async function upsertAsteroid(asteroid: Asteroid, observedAt: string): Promise<void> {
  await db.query(
    `INSERT INTO asteroid (
       spk_id, designation, full_name, absolute_magnitude,
       diameter_min_m, diameter_max_m, is_potentially_hazardous,
       is_sentry_object, jpl_url, observed_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     ON CONFLICT (spk_id) DO UPDATE SET
       designation = EXCLUDED.designation,
       full_name = EXCLUDED.full_name,
       absolute_magnitude = EXCLUDED.absolute_magnitude,
       diameter_min_m = EXCLUDED.diameter_min_m,
       diameter_max_m = EXCLUDED.diameter_max_m,
       is_potentially_hazardous = EXCLUDED.is_potentially_hazardous,
       is_sentry_object = EXCLUDED.is_sentry_object,
       jpl_url = EXCLUDED.jpl_url,
       observed_at = EXCLUDED.observed_at,
       updated_at = now()`,
    [
      asteroid.spkId,
      asteroid.designation,
      asteroid.fullName,
      asteroid.absoluteMagnitude,
      asteroid.diameterMinM,
      asteroid.diameterMaxM,
      asteroid.isPotentiallyHazardous,
      asteroid.isSentryObject,
      asteroid.jplUrl,
      observedAt,
    ],
  );
}

export async function upsertCloseApproach(
  approach: CloseApproach,
  observedAt: string,
): Promise<void> {
  await db.query(
    `INSERT INTO close_approach (
       spk_id, approach_at, miss_distance_km, miss_distance_lunar,
       velocity_km_s, orbiting_body, observed_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (spk_id, approach_at) DO UPDATE SET
       miss_distance_km = EXCLUDED.miss_distance_km,
       miss_distance_lunar = EXCLUDED.miss_distance_lunar,
       velocity_km_s = EXCLUDED.velocity_km_s,
       orbiting_body = EXCLUDED.orbiting_body,
       observed_at = EXCLUDED.observed_at`,
    [
      approach.spkId,
      approach.approachAt,
      approach.missDistanceKm,
      approach.missDistanceLunar,
      approach.velocityKmS,
      approach.orbitingBody,
      observedAt,
    ],
  );
}

type SentryRiskRecord = Omit<SentryRisk, "spkId">;

export async function upsertSentryRisk(
  risk: SentryRiskRecord,
  observedAt: string,
): Promise<void> {
  await db.query(
    `INSERT INTO sentry_risk (
       designation, impact_probability, potential_impacts, palermo_scale_cum,
       palermo_scale_max, torino_scale_max, diameter_m, impact_velocity_km_s,
       impact_energy_mt, impact_year_first, impact_year_last, last_observed_at,
       observed_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
     ON CONFLICT (designation) DO UPDATE SET
       impact_probability = EXCLUDED.impact_probability,
       potential_impacts = EXCLUDED.potential_impacts,
       palermo_scale_cum = EXCLUDED.palermo_scale_cum,
       palermo_scale_max = EXCLUDED.palermo_scale_max,
       torino_scale_max = EXCLUDED.torino_scale_max,
       diameter_m = EXCLUDED.diameter_m,
       impact_velocity_km_s = EXCLUDED.impact_velocity_km_s,
       impact_energy_mt = EXCLUDED.impact_energy_mt,
       impact_year_first = EXCLUDED.impact_year_first,
       impact_year_last = EXCLUDED.impact_year_last,
       last_observed_at = EXCLUDED.last_observed_at,
       observed_at = EXCLUDED.observed_at,
       updated_at = now()`,
    [
      risk.designation,
      risk.impactProbability,
      risk.potentialImpacts,
      risk.palermoScaleCumulative,
      risk.palermoScaleMax,
      risk.torinoScaleMax,
      risk.diameterM,
      risk.impactVelocityKmS,
      risk.impactEnergyMt,
      risk.impactYearFirst,
      risk.impactYearLast,
      risk.lastObservedAt,
      observedAt,
    ],
  );
}

export async function insertSentryRiskHistory(
  risk: SentryRiskRecord,
  observedAt: string,
): Promise<void> {
  await db.query(
    `INSERT INTO sentry_risk_history (
       designation, observed_at, impact_probability, potential_impacts,
       palermo_scale_cum, torino_scale_max, impact_energy_mt
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (designation, observed_at) DO NOTHING`,
    [
      risk.designation,
      observedAt,
      risk.impactProbability,
      risk.potentialImpacts,
      risk.palermoScaleCumulative,
      risk.torinoScaleMax,
      risk.impactEnergyMt,
    ],
  );
}

export async function upsertSentryRemoval(
  removal: { designation: string; removedAt: Date | null },
  observedAt: string,
): Promise<void> {
  await db.query(
    `INSERT INTO sentry_removal (designation, removed_at, observed_at)
     VALUES ($1, $2, $3)
     ON CONFLICT (designation) DO UPDATE SET
       removed_at = EXCLUDED.removed_at,
       observed_at = EXCLUDED.observed_at`,
    [removal.designation, removal.removedAt, observedAt],
  );
}