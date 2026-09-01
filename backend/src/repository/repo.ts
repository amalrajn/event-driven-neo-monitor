import { db } from "../config/db.js";
import type { Asteroid } from "../types/asteroid.js";

export class AsteroidRepo {
    public async GetAsteroidsRepo(): Promise<Asteroid[]> {
        const result = await db.query<Asteroid>(
            `SELECT 
                spk_id as "spkId",
                designation,
                full_name as "fullName",
                absolute_magnitude as "absoluteMagnitude",
                diameter_min_m as "diameterMinM",
                diameter_max_m as "diameterMaxM",
                is_potentially_hazardous as "isPotentiallyHazardous",
                is_sentry_object as "isSentryObject",
                jpl_url as "jplUrl"
            FROM asteroid
            ORDER BY spk_id`,
        );
        return result.rows;
    }

    public async GetAsteroidsByDesignationRepo(designation: string): Promise<Asteroid | null> {
        const result = await db.query<Asteroid>(
            `SELECT 
                spk_id as "spkId",
                designation,
                full_name as "fullName",
                absolute_magnitude as "absoluteMagnitude",
                diameter_min_m as "diameterMinM",
                diameter_max_m as "diameterMaxM",
                is_potentially_hazardous as "isPotentiallyHazardous",
                is_sentry_object as "isSentryObject",
                jpl_url as "jplUrl"
            FROM asteroid
            WHERE designation = $1`,
            [designation],
        );
        return result.rows[0] ?? null;
    }

    public async getAsteroidHistorybyDesignationRepo(designation: string): Promise<Asteroid[] | null>{
        const result = await db.query<Asteroid>(
            `SELECT 
                spk_id as "spkId",
                designation,
                full_name as "fullName",
                absolute_magnitude as "absoluteMagnitude",
                diameter_min_m as "diameterMinM",
                diameter_max_m as "diameterMaxM",
                is_potentially_hazardous as "isPotentiallyHazardous",
                is_sentry_object as "isSentryObject",
                jpl_url as "jplUrl"
            FROM asteroid
            WHERE designation = $1`,
            [designation],
        );
        return result.rows ?? null;
    }
}