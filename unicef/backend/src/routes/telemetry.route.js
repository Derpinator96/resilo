import express from "express";
import { receiveTelemetry, getLatestTelemetry, getTelemetryHistory } from "../controllers/telemetry.controller.js";

const router = express.Router();
router.post("/",         receiveTelemetry);      // ESP32 POSTs here
router.get("/latest",    getLatestTelemetry);    // frontend GETs here
router.get("/history",   getTelemetryHistory);   // optional
export default router;