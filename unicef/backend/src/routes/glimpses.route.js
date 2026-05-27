import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import {
  uploadGlimpseImage,
  getAllGlimpses,
  getGlimpsesByDistrict,
  getGlimpsesByFacility,
  deleteGlimpse
} from "../controllers/glimpses.controller.js";

const router = Router();

router.post("/upload", upload.single("image"), uploadGlimpseImage);
router.get("/", getAllGlimpses);
router.get("/district/:district", getGlimpsesByDistrict);
router.get("/facility/:facilityName", getGlimpsesByFacility);
router.delete("/:id", deleteGlimpse);

export default router;