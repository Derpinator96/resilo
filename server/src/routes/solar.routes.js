// routes/forecast.routes.js
import express from "express";
import { getLatestForecasts } from "../controllers/solardata.controller.js";

const router = express.Router();

router.get("/forecasts", getLatestForecasts);

export default router;