import { Router } from "express";
import { getWeatherData } from "../controllers/weatherdata.controller.js";

const router = Router();

router.get("/", getWeatherData);

export default router;