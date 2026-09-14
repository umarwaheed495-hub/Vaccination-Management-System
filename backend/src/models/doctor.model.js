import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const doctorSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      index: true,
    },
    letterpad: {
      type: String,
      required: [true, "Letterpad is required"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    countryCode: {
      type: String,
      required: [true, "Country code is required"],
      default: "+92",
    },
    phoneNumber: {
      type: String,
      required: [true, "Phone number is required"],
    },
    mobileNumberWhatsapp: {
      type: String,
      required: false,
    },
    pmdcNumber: {
      type: String,
      required: [true, "PMDC Number is required"],
      unique: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["doctor", "admin"],
      default: "doctor",
    },

    // ==========================================
    // NEW OTP VERIFICATION FIELDS
    // ==========================================
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailOtp: {
      type: String,
    },
    emailOtpExpiry: {
      type: Date,
    },

    refreshToken: {
      type: String,
    },
    isWelcomeEmailSent: { 
      type: Boolean, 
      default: false 
    }
  },
  {
    timestamps: true,
  }
);

// Password Hashing (Save hone se pehle encrypt karein)
doctorSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  this.password = await bcrypt.hash(this.password, 10);
});

// Compare Password method
doctorSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// Access Token Generation
doctorSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      role: this.role, // Fix: Dynamically use schema role
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "1d",
    }
  );
};

// Refresh Token Generation
doctorSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "10d",
    }
  );
};

export const Doctor = mongoose.model("Doctor", doctorSchema);