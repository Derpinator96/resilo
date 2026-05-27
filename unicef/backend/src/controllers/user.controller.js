import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { User} from "../models/user.model.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"

const generateAccessAndRefereshTokens = async(userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}


    } catch (error) {
        // console.error("TOKEN GENERATION ERROR:", error);
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}

const registerUser = asyncHandler( async (req, res) => {

    const {fullName, email, username, password } = req.body

    if (
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{ username: username.toLowerCase() }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }
    //console.log(req.files);

    const user = await User.create({
        fullName,
        email, 
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )

} )

const loginUser = asyncHandler(async (req, res) =>{
    const { username, password} = req.body
    // console.log(email);

    if (!username) {
        throw new ApiError(400, "Username is required")
    }

    const user = await User.findOne({username: username.toLowerCase()})

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

   const isPasswordValid = await user.isPasswordCorrect(password)

   if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials")
    }

   const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200, 
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged In Successfully"
        )
    )

})

const logoutUser = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // this removes the field from document
            }
        },
        {
            returnDocument: "after"
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {

   const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request - no refresh token provided");
  }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
            
        }
    
        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production"
        }
    
        const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefereshTokens(user._id);
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200, 
                {accessToken, refreshToken: newRefreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})

const changeCurrentPassword = asyncHandler(async(req, res) => {
    const {oldPassword, newPassword} = req.body

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"))
})

const getCurrentUser = asyncHandler(async(req, res) => {
    return res
    .status(200)
    .json(new ApiResponse(
        200,
        req.user,
        "User fetched successfully"
    ))
})

// GET all users (admin only)
const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find().select("-password -refreshToken").sort({ createdAt: -1 });
    return res.status(200).json(new ApiResponse(200, users, "Users fetched successfully"));
});

// POST create user (admin only)
const adminCreateUser = asyncHandler(async (req, res) => {
    const { fullName, email, username, password, role } = req.body;

    if ([fullName, email, username, password].some((f) => f?.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }

    const existedUser = await User.findOne({
        $or: [{ username: username.toLowerCase() }, { email }]
    });
    if (existedUser) throw new ApiError(409, "User with email or username already exists");

    const user = await User.create({
        fullName, email, password,
        username: username.toLowerCase(),
        role: role || "dataentry"
    });

    const createdUser = await User.findById(user._id).select("-password -refreshToken");
    return res.status(201).json(new ApiResponse(201, createdUser, "User created successfully"));
});

// PATCH reset any user's password (admin only)
const adminResetPassword = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { newPassword } = req.body;

    if (!newPassword?.trim()) throw new ApiError(400, "New password is required");

    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, "User not found");

    if (user.role === "admin" && user._id.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Cannot reset another admin's password");
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });
    return res.status(200).json(new ApiResponse(200, {}, "Password reset successfully"));
});

// PATCH update role (admin only)
const adminUpdateRole = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { role } = req.body;

    if (!["admin", "dataentry", "viewer"].includes(role)) {
        throw new ApiError(400, "Invalid role");
    }
    if (userId === req.user._id.toString()) {
        throw new ApiError(400, "You cannot change your own role");
    }

    const user = await User.findByIdAndUpdate(userId, { role }, { new: true })
        .select("-password -refreshToken");
    if (!user) throw new ApiError(404, "User not found");

    return res.status(200).json(new ApiResponse(200, user, "Role updated successfully"));
});

// DELETE user (admin only)
const adminDeleteUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (userId === req.user._id.toString()) {
        throw new ApiError(400, "You cannot delete your own account");
    }

    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, "User not found");
    if (user.role === "admin") throw new ApiError(403, "Cannot delete an admin account");

    await User.findByIdAndDelete(userId);
    return res.status(200).json(new ApiResponse(200, {}, "User deleted successfully"));
});

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    getAllUsers,
    adminCreateUser,
    adminResetPassword,
    adminUpdateRole,
    adminDeleteUser
}