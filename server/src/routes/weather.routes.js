import { Router } from "express";
import { getWeatherData } from "../controllers/weatherdata.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", verifyJWT, getWeatherData);

export default router;