import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Doctor } from "../models/doctor.model.js";
import { generateOTP } from "../utils/generateOtp.js";
import { sendEmail } from "../utils/sendEmail.js";
import { verifyEmailTemp } from "../email_templates/verifyEmailTemp.js";
import { welcomeEmailTemp } from "../email_templates/welcomeEmailTemp.js";
import { resendOtpEmailTemp } from "../email_templates/resendOtpEmailTemp.js";
import { resetSuccessEmailTemp } from "../email_templates/resetSuccessEmailTemp.js";
import { Vaccination } from "../models/vaccination.model.js";
import DEFAULT_VACCINATION_SCHEDULE from '../utils/defaultSchedule.js';
import DEFAULT_VACCINE_BRANDS from '../utils/defaultVaccines.js';
import {VaccineBrand} from '../models/vaccineBrand.model.js'; 

// =========================================================================
// HELPER FUNCTION: Access aur Refresh Tokens Generate karne ke liye
// =========================================================================
const generateAccessAndRefreshTokens = async (doctorId) => {
  try {
    const doctor = await Doctor.findById(doctorId);

    if (!doctor) {
      throw new ApiError(404, "Doctor not found for generating tokens.");
    }

    const accessToken = doctor.generateAccessToken();
    const refreshToken = doctor.generateRefreshToken();

    doctor.refreshToken = refreshToken;
    await doctor.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      error?.message || "Something went wrong while generating tokens."
    );
  }
};

// =========================================================================
// 1. REGISTER DOCTOR CONTROLLER (With OTP Verification & Seeding from Utils)
// =========================================================================
const registerDoctor = asyncHandler(async (req, res) => {
  const {
    name,
    letterpad,
    email,
    password,
    confirmPassword,
    countryCode,
    phoneNumber,
    mobileNumberWhatsapp,
    pmdcNumber,
  } = req.body;

  if (
    [name, letterpad, email, password, confirmPassword, countryCode, phoneNumber, pmdcNumber].some(
      (field) => !field || field?.trim() === ""
    )
  ) {
    throw new ApiError(400, "Validation Failed: All required fields must be provided.");
  }

  const emailRegex = /^\S+@\S+\.\S+$/;
  if (!emailRegex.test(email?.trim())) {
    throw new ApiError(400, "Validation Failed: Please enter a valid email address.");
  }

  if (password.length < 8) {
    throw new ApiError(400, "Validation Failed: Password must be at least 8 characters long.");
  }

  if (password !== confirmPassword) {
    throw new ApiError(400, "Validation Failed: Password and Confirm Password do not match.");
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name.trim();

  const existingDoctor = await Doctor.findOne({
    $or: [{ email: cleanEmail }, { pmdcNumber: pmdcNumber.trim() }, { name: cleanName }],
  });

  if (existingDoctor) {
    throw new ApiError(409, "Doctor with this Email, Name, or PMDC Number already exists.");
  }

  const otp = generateOTP();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

  const doctor = await Doctor.create({
    name: cleanName,
    letterpad: letterpad?.trim(),
    email: cleanEmail,
    password,
    countryCode: countryCode?.trim() || "+92",
    phoneNumber: phoneNumber?.trim(),
    mobileNumberWhatsapp: mobileNumberWhatsapp ? mobileNumberWhatsapp.trim() : "",
    pmdcNumber: pmdcNumber?.trim(),
    emailOtp: otp,
    emailOtpExpiry: otpExpiry,
    isEmailVerified: false,
  });

  // Try sending email, if it fails rollback doctor creation
  try {
    await sendEmail({
      email: doctor.email,
      subject: "Verify Your Email - OTP",
      message: verifyEmailTemp(doctor.name, otp),
    });
  } catch (error) {
    await Doctor.findByIdAndDelete(doctor._id);
    throw new ApiError(500, "Failed to send OTP email. Please try again.");
  }

  // ==========================================
  // 1. DEFAULT VACCINATION SCHEDULE SEEDING
  // ==========================================
  try {
    const defaultScheduleWithId = DEFAULT_VACCINATION_SCHEDULE.map((item) => ({
      ...item,
      doctorId: doctor._id,
    }));

    if (defaultScheduleWithId.length > 0) {
      await Vaccination.insertMany(defaultScheduleWithId);
    }
  } catch (scheduleError) {
    console.error("Default vaccination schedule seeding failed:", scheduleError);
  }

  // ==========================================
  // 2. DEFAULT VACCINE BRANDS SEEDING
  // ==========================================
  try {
    const defaultBrandsWithId = DEFAULT_VACCINE_BRANDS.map((brand) => ({
      ...brand,
      doctorId: doctor._id,
    }));

    if (defaultBrandsWithId.length > 0) {
      await VaccineBrand.insertMany(defaultBrandsWithId);
    }
  } catch (brandError) {
    console.error("Default vaccine brands seeding failed:", brandError);
  }

  const createdDoctor = await Doctor.findById(doctor._id).select(
    "-password -refreshToken -emailOtp -emailOtpExpiry"
  );

  if (!createdDoctor) {
    throw new ApiError(
      500,
      "Database Error: Doctor account was created but could not be retrieved from the database."
    );
  }

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        createdDoctor,
        "Doctor registered successfully! Please check your email for OTP verification."
      )
    );
});

// =========================================================================
// 2. LOGIN DOCTOR CONTROLLER
// =========================================================================
const loginDoctor = asyncHandler(async (req, res) => {
  const { phoneNumber, password } = req.body;

  if (!phoneNumber || !password) {
    throw new ApiError(400, "Validation Failed: Phone number and password are required.");
  }

  const doctor = await Doctor.findOne({ phoneNumber: phoneNumber.trim() });

  if (!doctor) {
    throw new ApiError(404, "Authentication Failed: Doctor with this phone number does not exist.");
  }

  if (!doctor.isEmailVerified) {
    throw new ApiError(
      403,
      "Access Denied: Your email is not verified. Please verify your OTP before logging in."
    );
  }

  const isPasswordValid = await doctor.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Authentication Failed: Invalid password.");
  }

  if (!doctor.isWelcomeEmailSent) {
    try {
      await sendEmail({
        email: doctor.email,
        subject: "Welcome to Vaccination Management System 🎉",
        message: welcomeEmailTemp(doctor.name),
      });

      doctor.isWelcomeEmailSent = true;
      await doctor.save({ validateBeforeSave: false });
    } catch (emailError) {
      console.error("Welcome email sending failed:", emailError);
    }
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(doctor._id);

  const loggedInDoctor = await Doctor.findById(doctor._id).select(
    "-password -refreshToken -emailOtp -emailOtpExpiry"
  );

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          doctor: loggedInDoctor,
          accessToken,
          refreshToken,
        },
        `Doctor ${loggedInDoctor.name} logged in successfully!`
      )
    );
});

// =========================================================================
// 3. LOGOUT DOCTOR CONTROLLER
// =========================================================================
const logoutDoctor = asyncHandler(async (req, res) => {
  await Doctor.findByIdAndUpdate(
    req.doctor._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "Doctor logged out successfully!"));
});

// =========================================================================
// 4. REFRESH ACCESS TOKEN CONTROLLER
// =========================================================================
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized Request: Refresh token is missing.");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const doctor = await Doctor.findById(decodedToken?._id);

    if (!doctor) {
      throw new ApiError(401, "Invalid refresh token.");
    }

    if (incomingRefreshToken !== doctor.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or already used.");
    }

    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    };

    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefreshTokens(doctor._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed successfully!"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token.");
  }
});

// =========================================================================
// 5. VERIFY EMAIL OTP CONTROLLER
// =========================================================================
const verifyEmailOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    throw new ApiError(400, "Validation Failed: Email and OTP are required.");
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanOtp = otp.toString().trim();

  const doctor = await Doctor.findOne({ email: cleanEmail });

  if (!doctor) {
    throw new ApiError(404, "Doctor not found with this email address.");
  }

  if (doctor.isEmailVerified) {
    throw new ApiError(400, "Bad Request: Email is already verified. You can log in.");
  }

  if (doctor.emailOtp !== cleanOtp) {
    throw new ApiError(400, "Invalid OTP: The OTP you entered is incorrect.");
  }

  if (doctor.emailOtpExpiry < new Date()) {
    throw new ApiError(
      400,
      "OTP Expired: The OTP has expired. Please request a new OTP."
    );
  }

  doctor.isEmailVerified = true;
  doctor.emailOtp = undefined;
  doctor.emailOtpExpiry = undefined;

  await doctor.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { isEmailVerified: true },
        "Email verified successfully! You can now log in."
      )
    );
});

// =========================================================================
// 6. RESEND OTP CONTROLLER
// =========================================================================
const resendOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, "Validation Failed: Email is required.");
  }

  const doctor = await Doctor.findOne({ email: email.trim().toLowerCase() });

  if (!doctor) {
    throw new ApiError(404, "Doctor not found with this email address.");
  }

  const otp = generateOTP();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

  doctor.emailOtp = otp;
  doctor.emailOtpExpiry = otpExpiry;
  await doctor.save({ validateBeforeSave: false });

  await sendEmail({
    email: doctor.email,
    subject: "Resend Email OTP",
    message: resendOtpEmailTemp(doctor.name, otp),
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "A new OTP has been sent to your email address."));
});

// =========================================================================
// 7. GET CURRENT LOGGED-IN DOCTOR CONTROLLER
// =========================================================================
const getCurrentDoctor = asyncHandler(async (req, res) => {
  const doctor = req.doctor;

  if (!doctor) {
    throw new ApiError(404, "Doctor profile not found.");
  }

  const dashboardData = {
    _id: doctor._id,
    name: doctor.name,
    email: doctor.email,
    letterpad: doctor.letterpad,
    countryCode: doctor.countryCode,
    phoneNumber: doctor.phoneNumber,
    mobileNumberWhatsapp: doctor.mobileNumberWhatsapp,
    pmdcNumber: doctor.pmdcNumber,
    isEmailVerified: doctor.isEmailVerified,
    createdAt: doctor.createdAt,
  };

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        dashboardData,
        "Current doctor profile fetched successfully for dashboard!"
      )
    );
});

// =========================================================================
// 8. FORGOT PASSWORD CONTROLLER
// =========================================================================
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email || email.trim() === "") {
    throw new ApiError(400, "Validation Failed: Email address is required.");
  }

  const cleanEmail = email.trim().toLowerCase();

  const doctor = await Doctor.findOne({ email: cleanEmail });

  if (!doctor) {
    throw new ApiError(404, "Doctor with this email address does not exist.");
  }

  const otp = generateOTP();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

  doctor.emailOtp = otp;
  doctor.emailOtpExpiry = otpExpiry;
  await doctor.save({ validateBeforeSave: false });

  await sendEmail({
    email: doctor.email,
    subject: "Reset Password - OTP Code",
    message: resendOtpEmailTemp(doctor.name, otp),
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { email: doctor.email },
        "Password reset OTP sent to your email successfully."
      )
    );
});

// =========================================================================
// 9. VERIFY OTP & RESET PASSWORD CONTROLLER
// =========================================================================
const verifyOtpAndResetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || email.trim() === "") {
    throw new ApiError(400, "Validation Failed: Email is required.");
  }
  if (!otp || otp.toString().trim() === "") {
    throw new ApiError(400, "Validation Failed: OTP code is required.");
  }
  if (!newPassword || newPassword.trim() === "") {
    throw new ApiError(400, "Validation Failed: New password is required.");
  }

  if (newPassword.length < 8) {
    throw new ApiError(400, "Validation Failed: New password must be at least 8 characters long.");
  }

  const cleanEmail = email.trim().toLowerCase();

  const doctor = await Doctor.findOne({ email: cleanEmail });

  if (!doctor) {
    throw new ApiError(404, "Doctor with this email address does not exist.");
  }

  if (!doctor.emailOtp || !doctor.emailOtpExpiry) {
    throw new ApiError(400, "No OTP request found for this email address.");
  }

  if (new Date() > new Date(doctor.emailOtpExpiry)) {
    throw new ApiError(400, "OTP code has expired. Please request a new one.");
  }

  if (doctor.emailOtp !== otp.toString().trim()) {
    throw new ApiError(400, "Invalid OTP code. Please check and try again.");
  }

  doctor.password = newPassword; 
  doctor.emailOtp = undefined;
  doctor.emailOtpExpiry = undefined;

  await doctor.save();

  // Send Reset Success Confirmation Email (Added back for better UX)
  try {
    await sendEmail({
      email: doctor.email,
      subject: "Password Changed Successfully",
      message: resetSuccessEmailTemp(doctor.name),
    });
  } catch (error) {
    console.error("Failed to send reset confirmation email:", error);
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      { email: doctor.email },
      "Password has been reset successfully. You can now login with your new password."
    )
  );
});

export {
  registerDoctor,
  loginDoctor,
  logoutDoctor,
  refreshAccessToken,
  verifyEmailOTP,
  resendOTP,
  getCurrentDoctor,
  forgotPassword,
  verifyOtpAndResetPassword
};