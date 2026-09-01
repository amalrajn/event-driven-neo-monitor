import { AsteroidRepo } from "../repository/repo.js";
import type { Asteroid } from "../types/asteroid.js";

export class AsteroidService {
    private ast_repo = new AsteroidRepo();

    public async GetAsteroidService(): Promise<Asteroid[]> {
        try {
            return await this.ast_repo.GetAsteroidsRepo();
        } catch (error) {
            console.error("Failed to fetch all asteroids:", error);
            throw new Error("Failed to fetch asteroids from database");
        }
    }

    public async GetAsteroidsByDesignationService(designation: string): Promise<Asteroid> {
        if (!designation || designation.trim().length === 0) {
            throw new Error("Designation is required");
        }
        try {
            const asteroid = await this.ast_repo.GetAsteroidsByDesignationRepo(designation);
            if (!asteroid) {
                throw new Error(`Asteroid with designation '${designation}' not found`);
            }
            return asteroid;
        } catch (error) {
            console.error(`Failed to fetch asteroid by designation '${designation}':`, error);
            throw error;
        }
    }

    public async getAsteroidHistoryByDesignationService(designation: string): Promise<Asteroid[]>{
        if (!designation || designation.trim().length === 0) {
            throw new Error("Designation is required");
        }
        try {
            const asteroid = await this.ast_repo.getAsteroidHistorybyDesignationRepo(designation);
            if (!asteroid) {
                throw new Error(`Asteroid history with designation '${designation}' not found`);
            }
            return asteroid;
        } catch (error) {
            console.error(`Failed to fetch asteroid history by designation '${designation}':`, error);
            throw error;
        }
    }
}