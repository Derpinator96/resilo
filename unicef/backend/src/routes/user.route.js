import { Router } from "express";
import { verifyAdmin } from "../middlewares/admin.middleware.js";
import { 
    loginUser, 
    logoutUser, 
    registerUser, 
    refreshAccessToken, 
    changeCurrentPassword, 
    getCurrentUser,
    getAllUsers,
    adminCreateUser,
    adminResetPassword,
    adminUpdateRole,
    adminDeleteUser
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";


const router = Router()

router.route("/register").post(registerUser)

router.route("/login").post(loginUser)

//secured routes
router.route("/logout").post(verifyJWT,  logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT, changeCurrentPassword)
router.route("/current-user").get(verifyJWT, getCurrentUser)

// Add these 5 routes at the bottom (existing routes unchanged):
router.route("/admin/users").get(verifyJWT, verifyAdmin, getAllUsers)
router.route("/admin/users").post(verifyJWT, verifyAdmin, adminCreateUser)
router.route("/admin/users/:userId/reset-password").patch(verifyJWT, verifyAdmin, adminResetPassword)
router.route("/admin/users/:userId/role").patch(verifyJWT, verifyAdmin, adminUpdateRole)
router.route("/admin/users/:userId").delete(verifyJWT, verifyAdmin, adminDeleteUser)

export default router