import { Router } from "express";
import multer from "multer"
import { 
    loginUser, 
    logoutUser, 
    registerUser, 
    refreshAccessToken, 
    getCurrentUser, 
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const upload = multer()
const router = Router()

router.route("/register").post( upload.none(),registerUser)
router.route("/login").post( upload.none(),loginUser)

//secured routes
router.route("/logout").post(verifyJWT,  logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/current-user").get(verifyJWT, getCurrentUser)

export default router