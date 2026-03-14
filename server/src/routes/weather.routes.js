import { Router } from "express";
import {  
} from "../controllers/weatherdata.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";


const router = Router()

export default router