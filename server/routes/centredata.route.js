import express from "express";
import { upload } from "../middleware/multer.middleware.js";
import {
  addCentreData,
  getCentreDataByDistrict,
  updateSolarGeneration,
  updateCentreData,
  getGhgReductionByDistrict,
  getCentreWiseGhgReduction,
  getAuditSummary,
  getAuditedDistricts
} from "../controllers/centredata.controller.js";

const router = express.Router();

// ─── SPECIFIC ROUTES FIRST (no parameters) ───
router.get("/ghg-reduction", getGhgReductionByDistrict);

router.get("/centre-ghg-reduction", getCentreWiseGhgReduction);

router.get("/summary", getAuditSummary);
router.get("/audited-districts", getAuditedDistricts);

router.post(
  "/data",
  upload.fields([
    { name: "file",                  maxCount: 1 },
    { name: "siteImage",             maxCount: 1 },
    { name: "panelImage",            maxCount: 1 },
    { name: "panelRatingImage",      maxCount: 1 },
    { name: "batteryImage",          maxCount: 1 },
    { name: "batteryRatingImage",    maxCount: 1 },
    { name: "inverterImage",         maxCount: 1 },
    { name: "inverterRatingImage",   maxCount: 1 },
  ]),
  addCentreData
);

router.get("/:district", getCentreDataByDistrict);

router.put("/:id/update-solar", updateSolarGeneration);

router.route("/update/:id").patch(
  upload.fields([
    { name: "file", maxCount: 1 },
    { name: "siteImage", maxCount: 1 },
    { name: "panelImage", maxCount: 1 },
    { name: "panelRatingImage", maxCount: 1 },
    { name: "batteryImage", maxCount: 1 },
    { name: "batteryRatingImage", maxCount: 1 },
    { name: "inverterImage", maxCount: 1 },
    { name: "inverterRatingImage", maxCount: 1 },
  ]),
  updateCentreData
);

// ─── DYNAMIC ROUTES (with parameters) ───
router.get("/:district", getCentreDataByDistrict);



export default router;