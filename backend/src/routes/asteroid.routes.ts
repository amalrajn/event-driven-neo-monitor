import { Router } from "express";
import { AsteroidController } from "../controllers/asteroid.controller.js";

const router = Router();
const controller = new AsteroidController();

router.get("/", controller.GetAsteroids.bind(controller));
router.get("/:designation/history", controller.getAsteroidHistoryByDesignationHistory.bind(controller));
router.get("/:designation", controller.GetAsteroidsbyDesignation.bind(controller));

export default router;
