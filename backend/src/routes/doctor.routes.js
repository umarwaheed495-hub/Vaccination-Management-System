import { Router } from "express";
import {
  registerDoctor,
  loginDoctor,
  logoutDoctor,
  refreshAccessToken,
  verifyEmailOTP,
  resendOTP,
  getCurrentDoctor,
  forgotPassword,
  verifyOtpAndResetPassword 
  // resetPassword
} from "../controllers/doctor.controller.js"; 
import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";

const router = Router();

// =========================================================================
// PUBLIC ROUTES (No Token Needed)
// =========================================================================

// 1. Doctor Registration
router.route("/register").post(registerDoctor);

// 2. Email OTP Verification
router.route("/verify-otp").post(verifyEmailOTP);

// 3. Resend Email OTP
router.route("/resend-otp").post(resendOTP);

// 4. Doctor Login
router.route("/login").post(loginDoctor);

// 5. Refresh Access Token
router.route("/refresh-token").post(refreshAccessToken);

// 6. Forgot Password (Send OTP to Email)
router.route("/forgot-password").post(forgotPassword);

router.route("/verify-reset-otp").post(verifyOtpAndResetPassword);

// // 7. Reset Password (Verify OTP + Update Password)
// router.route("/reset-password").post(resetPassword);

// =========================================================================
// PROTECTED ROUTES (JWT Token Verification Required)
// =========================================================================

// 8. Doctor Logout
router.route("/logout").post(verifyJWT, logoutDoctor);

// Protected & Role Authorized Route
router
  .route("/me")
  .get(verifyJWT, authorizeRoles("doctor"), getCurrentDoctor);

export default router;