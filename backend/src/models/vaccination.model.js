import mongoose from "mongoose";

const vaccinationSchema = new mongoose.Schema(
    {
        doctorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Doctor",
            required: true
        },
        name: {
            type: String,
            required: true,
            trim: true
        },
        recommendedAge: {
            type: String, // Recommended Age / Date
            required: true
        }
    },
    {
        timestamps: true
    }
);

vaccinationSchema.index({ doctorId: 1 });

export const Vaccination = mongoose.model("Vaccination", vaccinationSchema);