import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Doctor } from "../models/doctor.model.js";

// 1. Authentication Middleware (Verify Token)
export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {

    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      throw new ApiError(401, "Unauthorized Request: Access token is missing.");
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const doctor = await Doctor.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    if (!doctor) {
      throw new ApiError(401, "Unauthorized Request: Invalid Access Token.");
    }

    req.doctor = doctor;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid or Expired Access Token.");
  }
});

// 2. Authorization Middleware (Check Roles/Permissions)
export const authorizeRoles = (...allowedRoles) => {
  return asyncHandler(async (req, res, next) => {
    if (!req.doctor || !allowedRoles.includes(req.doctor.role)) {
      throw new ApiError(
        403,
        `Access Denied: Role (${req.doctor?.role || "Guest"}) is not authorized to access this resource.`
      );
    }
    next();
  });
};