import mongoose, { Schema } from "mongoose";

const clinicSchema = new Schema(
    {
        doctorId: {
            type: Schema.Types.ObjectId,
            ref: "Doctor", // Directly references your Doctor model
            required: true,
        },
        clinicName: {
            type: String,
            required: [true, "Clinic name is required"],
            trim: true
        },
        phone: {
            type: String,
            required: [true, "Phone number is required"],
            trim: true
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            lowercase: true,
            trim: true
        },
        address: {
            type: String,
            required: [true, "Address is required"]
        },
        city: {
            type: String,
            required: [true, "City is required"],
            trim: true
        },
        consultationFee: {
            type: Number,
            required: [true, "Fee is required"],
            min: 0
        },
        totalBeds: {
            type: Number,
            required: [true, "Total beds count is required"],
            min: 0
        },
        workingDays: {
            type: [String],
            required: true,
            validate: [array => array.length > 0, "Select at least one working day"],
        },
        startTime: {
            type: String,
            required: [true, "Start time is required"]
        },
        endTime: {
            type: String,
            required: [true, "End time is required"]
        },
        isActive: {
            type: Boolean,
            default: false, // By default status false rahega
        },
    },
    { timestamps: true }
);

/**
 * Compound Index for Schedule Conflict Checks
 * Optimizes performance when querying overlapping operating days and times 
 * for a specific doctor's clinics.
 */
clinicSchema.index({ doctorId: 1, workingDays: 1 });

export const Clinic = mongoose.model("Clinic", clinicSchema);