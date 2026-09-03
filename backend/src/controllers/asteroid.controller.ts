import { Request, Response } from "express";
import { AsteroidService } from "../services/asteroid.services.js";
import { DesignationParams } from "../interfaces/interfaces.js";

export class AsteroidController {
    private ast_service = new AsteroidService();

    public async GetAsteroids(req: Request, res: Response): Promise<void> {
        try {
            const ast_data = await this.ast_service.GetAsteroidService();
            res.json(ast_data);
        } catch (error) {
            console.error("Controller error:", error);
            res.status(500).json({ message: "Failed to fetch asteroids" });
        }
    }

    public async GetAsteroidsbyDesignation(
        req: Request<DesignationParams>,
        res: Response,
    ): Promise<void> {
        try {
            const { designation } = req.params;
            const ast_data = await this.ast_service.GetAsteroidsByDesignationService(designation);
            res.json(ast_data);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Unknown error";
            if (message.includes("not found")) {
                res.status(404).json({ message });
            } else if (message.includes("required")) {
                res.status(400).json({ message });
            } else {
                res.status(500).json({ message: "Failed to fetch asteroid" });
            }
        }
    }

    public async getAsteroidHistoryByDesignationHistory(
        req: Request<DesignationParams>, 
        res: Response
    ): Promise<void> {
        try {
            const { designation } = req.params;
            const ast_data = await this.ast_service.getAsteroidHistoryByDesignationService(designation);
            res.json(ast_data);
        }
        catch (error: unknown){
            const message = error instanceof Error ? error.message : "Unknown error";
            if (message.includes("not found")){
                res.status(404).json({message});
            }
            else if(message.includes("Designation is required")){
                res.status(400).json({message});
            }
            else {
                res.status(500).json({message: "Failed to fetch"});
            }
        }
    }
}