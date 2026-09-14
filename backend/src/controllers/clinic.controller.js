import { Clinic } from "../models/clinic.model.js";
import { parseTimeToMinutes, isTimeOverlapping } from "../utils/timeHelpers.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";

// 1. Create Clinic Logic
const createClinic = asyncHandler(async (req, res) => {
  const doctorId = req.doctor?._id || req.user?._id;

  if (!doctorId) {
    throw new ApiError(401, "Unauthorized request. Doctor identity missing.");
  }

  const {
    clinicName,
    phone,
    email,
    address,
    city,
    consultationFee,
    totalBeds,
    workingDays,
    startTime,
    endTime,
  } = req.body;

  // Existing clinics fetch kar rahe hain sirf yeh check karne ke liye ke pehli clinic hai ya nahi
  const existingClinics = await Clinic.find({ doctorId });

  // Agar yeh doctor ka pehla clinic hai, to isay automatically Active kar dein
  const isFirstClinic = existingClinics.length === 0;

  const newClinic = await Clinic.create({
    doctorId,
    clinicName,
    phone,
    email,
    address,
    city,
    consultationFee,
    totalBeds,
    workingDays,
    startTime,
    endTime,
    isActive: isFirstClinic, // Pehla clinic auto-active, baki inactive
  });

  return res
    .status(201)
    .json(new ApiResponse(201, newClinic, "Clinic registered successfully."));
});
// 2. Get Doctor Clinics Logic

const getMyClinics = asyncHandler(async (req, res) => {
  const doctorId = req.doctor?._id || req.user?._id;

  if (!doctorId) {
    throw new ApiError(401, "Unauthorized request. Doctor identity missing.");
  }

  // Safety conversion to ObjectId to prevent aggregation match bugs
  const doctorObjectId = new mongoose.Types.ObjectId(doctorId);

  const clinics = await Clinic.aggregate([
    { 
      $match: { 
        doctorId: doctorObjectId 
      } 
    },
    { 
      $sort: { 
        createdAt: -1 
      } 
    },
    {
      $lookup: {
        from: "patients", // Database mein patients collection ka exact name
        localField: "_id",
        foreignField: "clinicId", // Patient schema ki field jo clinic ID se link hai
        as: "patientsList"
      }
    },
    {
      $addFields: {
        totalPatients: { 
          $size: { $ifNull: ["$patientsList", []] } // Safe check: agar array null ho toh crash na ho
        }
      }
    },
    {
      $project: {
        patientsList: 0 // Heavy array ko response se remove kar diya taake speed fast rahe
      }
    }
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, clinics, "Clinics fetched successfully."));
});

// 3. Update Clinic Logic (Fixed with Overlap Validation)
const updateClinic = asyncHandler(async (req, res) => {
  const { clinicId } = req.params;
  const doctorId = req.doctor?._id || req.user?._id;

  const clinic = await Clinic.findOne({ _id: clinicId, doctorId });
  if (!clinic) {
    throw new ApiError(404, "Clinic not found or unauthorized access.");
  }

  const { workingDays, startTime, endTime } = req.body;

  // Agar update mein time ya working days diye gaye hain, toh overlap check karein
  if (startTime || endTime || workingDays) {
    const targetStart = parseTimeToMinutes(startTime || clinic.startTime);
    const targetEnd = parseTimeToMinutes(endTime || clinic.endTime);
    const targetDays = workingDays || clinic.workingDays || [];

    if (targetStart >= targetEnd) {
      throw new ApiError(400, "Start time must be strictly earlier than end time.");
    }

    // Baqi clinics ko check karein (current clinic ko chor kar)
    const otherClinics = await Clinic.find({ doctorId, _id: { $ne: clinicId } });

    for (const other of otherClinics) {
      const otherDays = other.workingDays || [];
      const commonDays = otherDays.filter((day) => targetDays.includes(day));

      if (commonDays.length > 0) {
        const existStart = parseTimeToMinutes(other.startTime);
        const existEnd = parseTimeToMinutes(other.endTime);

        if (isTimeOverlapping(targetStart, targetEnd, existStart, existEnd)) {
          throw new ApiError(
            400,
            `Schedule Conflict! You already have "${other.clinicName}" running on [${commonDays.join(", ")}] between ${other.startTime} - ${other.endTime}.`
          );
        }
      }
    }
  }

  const updatedClinic = await Clinic.findByIdAndUpdate(
    clinicId,
    { $set: req.body },
    { new: true, runValidators: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, updatedClinic, "Clinic updated successfully."));
});

// 4. Delete Clinic Logic
const deleteClinic = asyncHandler(async (req, res) => {
  const { clinicId } = req.params;
  const doctorId = req.doctor?._id || req.user?._id;

  // Pehle clinic ko find karein (findOneAndDelete ki bajaye findOne taake status check ho sakay)
  const clinic = await Clinic.findOne({ _id: clinicId, doctorId });
  
  if (!clinic) {
    throw new ApiError(404, "Clinic not found or unauthorized access.");
  }

  // Check: Agar clinic active hai toh deletion block kar dein
  if (clinic.isActive) {
    throw new ApiError(
      400,
      "Active clinic cannot be deleted! Please switch or activate another clinic first."
    );
  }

  // Agar active nahi hai, tab safely delete karein
  await Clinic.findByIdAndDelete(clinicId);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Clinic deleted successfully."));
});

// =========================================================================
// 5. TOGGLE CLINIC ACTIVE STATUS LOGIC (SINGLE ACTIVE CLINIC RULE)
// =========================================================================
const toggleClinicStatus = asyncHandler(async (req, res) => {
  const { clinicId } = req.params;
  const doctorId = req.doctor?._id || req.user?._id;

  if (!doctorId) {
    throw new ApiError(401, "Unauthorized request. Doctor identity missing.");
  }

  // Selected clinic ko check karein
  const clinic = await Clinic.findOne({ _id: clinicId, doctorId });

  if (!clinic) {
    throw new ApiError(404, "Clinic not found or unauthorized access.");
  }

  // Toggle state logic: true hai to false, false hai to true
  const targetStatus = !clinic.isActive;

  if (targetStatus === true) {
    // Single Active Rule: Pehle doctor ke tamaam clinics ko `isActive: false` kar dein
    await Clinic.updateMany(
      { doctorId },
      { $set: { isActive: false } }
    );

    // Dynamic Selected clinic ko `isActive: true` save karein
    clinic.isActive = true;
    await clinic.save();
  } else {
    // Agar doctor ne active clinic ko band (off) kiya
    clinic.isActive = false;
    await clinic.save();
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      { clinicId: clinic._id, isActive: clinic.isActive },
      `Clinic status set to ${clinic.isActive ? "Active" : "Inactive"}`
    )
  );
});

export {
  createClinic,
  getMyClinics,
  updateClinic,
  deleteClinic,
  toggleClinicStatus,
};