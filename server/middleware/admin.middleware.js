import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const verifyAdmin = asyncHandler(async (req, _, next) => {
    try {
        if (req.user?.role !== "admin") {
        throw new ApiError(403, "Access denied. Admins only.");
    }
    next();}
    catch (error) {
        throw new ApiError(403, error?.message || "Access denied. Admins only.");
    }
});