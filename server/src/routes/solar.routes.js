import { Router } from "express";
import {  
} from "../controllers/solardata.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";


const router = Router()

export default router