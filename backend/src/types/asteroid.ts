// NASA JPL small-body SPK-ID, e.g. "3542519". Primary key everywhere.
// NeoWs calls it `neo_reference_id`; Sentry accepts it as `spk`.
export type SpkId = string;

/** Torino impact hazard scale: 0 (no hazard) through 10 (certain catastrophe). */
export type TorinoScale = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

/* -------------------------------------------------------------------------- */
/*  Entities                                                                   */
/* -------------------------------------------------------------------------- */

// Identity and physical properties. Slow-moving: only changes when new
// observations refine the magnitude. Postgres primary key `spkId`.
export interface Asteroid {
  spkId: SpkId;
  designation: string;
  fullName: string;
  absoluteMagnitude: number; // lower means bigger
  diameterMinM: number; // Diameter estimates in meters
  diameterMaxM: number;
  isPotentiallyHazardous: boolean;
  isSentryObject: boolean;
  jplUrl: string;
}

// One approach event. Separate from Asteroid because one object has many.
// Postgres composite primary key (spkId, approachAt) — no surrogate id needed.
export interface CloseApproach {
  spkId: SpkId;
  approachAt: Date;
  missDistanceKm: number;
  missDistanceLunar: number; // Same distance in lunar distances (1 LD ≈ 384,400 km)
  velocityKmS: number;
  orbitingBody: string;
}

/** Sentry's impact-risk assessment for one asteroid. Postgres key `spkId`. */
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
  impactEnergyMt: number | null; // Megatons TNT
  impactYearFirst: number | null;
  impactYearLast: number | null;
  lastObservedAt: Date | null;
}

/* -------------------------------------------------------------------------- */
/*  Read model                                                                 */
/* -------------------------------------------------------------------------- */

export interface AsteroidView extends Asteroid {
  nextApproach: CloseApproach | null;
  risk: SentryRisk | null;
}

/* -------------------------------------------------------------------------- */
/*  Constants                                                                  */
/* -------------------------------------------------------------------------- */

/** Mean Earth–Moon distance in km, for the missDistanceLunar conversion. */
export const LUNAR_DISTANCE_KM = 384_400;
