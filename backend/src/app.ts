import express from "express";
import cors from "cors";
import asteroidRoutes from "./routes/asteroid.routes.js";

const app = express();

app.use(cors());
app.use(express.json());
app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/asteroids", asteroidRoutes);

export default app;
