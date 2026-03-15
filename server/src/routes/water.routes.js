import express from "express";
import { getAllWaterQuality } from "../controllers/waterdata.controller.js";

const router = express.Router();

// Only one route: return all records
router.get("/water/all", getAllWaterQuality);

export default router;