import mongoose, { Schema } from "mongoose";

const patientSchema = new Schema(
  {
    patientName: {
      type: String,
      required: [true, "Patient name is required"],
      trim: true,
    },
    fatherName: {
      type: String,
      required: [true, "Father name is required"],
      trim: true,
    },
    dateOfBirth: {
      type: String, 
      required: [true, "Date of birth or age indicator is required"],
    },
    fatherCnic: {
      type: String,
      required: [true, "Father CNIC is required"],
      trim: true,
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true, 
    },
    clinicId: {
      type: Schema.Types.ObjectId,
      ref: "Clinic",
      required: [true, "Clinic reference is required"],
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: "Doctor",
      required: [true, "Doctor reference is required"],
    },
    patientVaccines: [
      {
        scheduleId: {
          type: Schema.Types.ObjectId,
          ref: "Vaccination",
        },
        dueDate: {
          type: Date, // Patient ki DOB aur vaccine ki age se calculate hone wali due date
        },
        givenDate: {
          type: Date, 
        },
       
        status: {
          type: String,
          enum: ["Pending", "Given"], 
          default: "Pending",
        },
        brandName: {
          type: String,
          trim: true,
          default: "",
        },
      },
    ],
  },
  { timestamps: true }
);

export const Patient = mongoose.model("Patient", patientSchema);