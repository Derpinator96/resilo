import express from "express";
import { getSolarForecast, getDeliveryEquipment } from "../controllers/mlforecast.controller.js";

const router = express.Router();

router.get("/forecast",  getSolarForecast);
router.get("/equipment", getDeliveryEquipment);

export default router;