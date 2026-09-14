import { Patient } from "../models/patient.model.js";
import { Clinic } from "../models/clinic.model.js";
import { Vaccination } from "../models/vaccination.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// Helper Function: Patient DOB aur Vaccine schedule string se Due Date calculate karne ke liye
const calculateDueDate = (dob, scheduleStr) => {
  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) return null;

  const str = scheduleStr ? scheduleStr.toLowerCase().trim() : "";
  
  if (str === "birth" || str === "at birth" || str === "0") {
    return birthDate;
  }

  const num = parseInt(str);
  if (isNaN(num)) return birthDate;

  const dueDate = new Date(birthDate);

  if (str.includes("week")) {
    dueDate.setDate(dueDate.getDate() + (num * 7));
  } else if (str.includes("month")) {
    dueDate.setMonth(dueDate.getMonth() + num);
  } else if (str.includes("year")) {
    dueDate.setFullYear(dueDate.getFullYear() + num);
  }

  return dueDate;
};

// =========================================================================
// 1. ADD NEW PATIENT (Clean Registration without pre-attaching vaccines)
// =========================================================================
const addPatient = asyncHandler(async (req, res) => {
  const doctorId = req.doctor?._id || req.user?._id;

  if (!doctorId) {
    throw new ApiError(401, "Unauthorized request. Doctor identity missing.");
  }

  const {
    patientName,
    fatherName,
    dateOfBirth,
    fatherCnic,
    city,
    phone,
    clinicId,
  } = req.body;

  // 1. Strict Input Validation (Check for empty fields)
  if (
    [patientName, fatherName, dateOfBirth, fatherCnic, city, phone, clinicId].some(
      (field) => !field || field?.toString().trim() === ""
    )
  ) {
    throw new ApiError(400, "Validation Failed: All required fields must be provided.");
  }

  // 2. Verify Clinic Existence & Authorization
  const clinic = await Clinic.findOne({ _id: clinicId, doctorId });
  if (!clinic) {
    throw new ApiError(404, "Clinic not found or unauthorized access to this clinic.");
  }

  // 3. Business Logic: Check if patient already exists in this clinic (by Phone or Father CNIC)
  const existingPatient = await Patient.findOne({
    clinicId,
    $or: [{ phone: phone.trim() }, { fatherCnic: fatherCnic.trim() }],
  });

  if (existingPatient) {
    throw new ApiError(
      409,
      "Conflict Error: A patient with this Phone Number or Father CNIC already exists in this clinic."
    );
  }

  // 4. Create and Save Patient Data (Clean registration)
  const newPatient = await Patient.create({
    patientName: patientName.trim(),
    fatherName: fatherName.trim(),
    dateOfBirth: dateOfBirth.trim(),
    fatherCnic: fatherCnic.trim(),
    city: city.trim(),
    phone: phone.trim(),
    clinicId,
    doctorId,
  });

  // 5. Confirm Data Storage in DB
  if (!newPatient) {
    throw new ApiError(500, "Database Error: Failed to register patient in the database.");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, newPatient, "Patient registered successfully."));
});

// =========================================================================
// 2. GET PATIENTS BY CLINIC ID
// =========================================================================
const getPatientsByClinic = asyncHandler(async (req, res) => {
  const { clinicId } = req.params;
  const doctorId = req.doctor?._id || req.user?._id;

  if (!doctorId) {
    throw new ApiError(401, "Unauthorized request. Doctor identity missing.");
  }

  // Verify clinic belongs to the doctor
  const clinic = await Clinic.findOne({ _id: clinicId, doctorId });
  if (!clinic) {
    throw new ApiError(404, "Clinic not found or unauthorized access.");
  }

  // Fetch data from DB
  const patients = await Patient.find({ clinicId }).sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, patients, "Patients fetched successfully for this clinic."));
});

// =========================================================================
// 3. GET PATIENT VACCINATION CARD (Calculates & loads schedule on click)
// =========================================================================
const getPatientVaccinationCard = asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const doctorId = req.doctor?._id || req.user?._id;

  if (!doctorId) {
    throw new ApiError(401, "Unauthorized request. Doctor identity missing.");
  }

  const patient = await Patient.findOne({ _id: patientId, doctorId });
  if (!patient) {
    throw new ApiError(404, "Patient not found or unauthorized access.");
  }

  // Doctor ki saari current vaccines fetch karein
  const doctorVaccines = await Vaccination.find({ doctorId });

  // Check karein ke kya patient ke paas pehle se vaccines mapped hain ya nahi, 
  // ya agar doctor ne nayi vaccine add ki hai toh unhe sync karein
  const updatedPatientVaccines = doctorVaccines.map((vac) => {
    const existingEntry = patient.patientVaccines.find(
      (pv) => pv.scheduleId && pv.scheduleId.toString() === vac._id.toString()
    );

    if (existingEntry) {
      return {
        ...(existingEntry.toObject ? existingEntry.toObject() : existingEntry),
      };
    } else {
      return {
        scheduleId: vac._id,
        dueDate: calculateDueDate(patient.dateOfBirth, vac.date),
        givenDate: null,
      };
    }
  });

  patient.patientVaccines = updatedPatientVaccines;
  await patient.save();

  // Populate karke complete details return karein
  const populatedPatient = await Patient.findById(patientId).populate(
    "patientVaccines.scheduleId"
  );

  return res
    .status(200)
    .json(new ApiResponse(200, populatedPatient, "Patient vaccination card fetched successfully."));
});

// =========================================================================
// 4. UPDATE PATIENT VACCINE GIVEN DATE
// =========================================================================
const updatePatientVaccineStatus = asyncHandler(async (req, res) => {
  const { patientId, vaccineId } = req.params; 
  const { givenDate } = req.body;
  const doctorId = req.doctor?._id || req.user?._id;

  if (!doctorId) {
    throw new ApiError(401, "Unauthorized request. Doctor identity missing.");
  }

  const patient = await Patient.findOne({ _id: patientId, doctorId });
  if (!patient) {
    throw new ApiError(404, "Patient not found or unauthorized access.");
  }

  // Find the specific vaccine entry in patient's array
  const vaccineEntry = patient.patientVaccines.find(
    (pv) => pv._id.toString() === vaccineId || (pv.scheduleId && pv.scheduleId.toString() === vaccineId)
  );

  if (!vaccineEntry) {
    throw new ApiError(404, "Vaccine record not found in patient's card.");
  }

  if (givenDate !== undefined) {
    vaccineEntry.givenDate = givenDate ? new Date(givenDate) : null;
  }

  await patient.save();

  const updatedPatient = await Patient.findById(patientId).populate(
    "patientVaccines.scheduleId"
  );

  return res
    .status(200)
    .json(new ApiResponse(200, updatedPatient, "Vaccine given date updated successfully."));
});

// =========================================================================
// 5. UPDATE PATIENT DETAILS (With Due Date Recalculation on DOB Change)
// =========================================================================
const updatePatient = asyncHandler(async (req, res) => {
  const { id } = req.params; // Patient ID
  const doctorId = req.doctor?._id || req.user?._id;

  if (!doctorId) {
    throw new ApiError(401, "Unauthorized request. Doctor identity missing.");
  }

  // Check if patient exists and belongs to this doctor
  const patient = await Patient.findOne({ _id: id, doctorId });
  if (!patient) {
    throw new ApiError(404, "Patient not found or unauthorized access.");
  }

  // 1. Pehle normal fields update perform karein
  let updatedPatient = await Patient.findByIdAndUpdate(
    id,
    { $set: req.body },
    { returnDocument: 'after', runValidators: true }
  );

  // Confirm update success in DB
  if (!updatedPatient) {
    throw new ApiError(500, "Database Error: Failed to update patient details.");
  }

  // 2. Agar request mein dateOfBirth change ki gayi hai, toh saari vaccines ki due dates ko recalculate karein
  if (req.body.dateOfBirth && req.body.dateOfBirth.trim() !== patient.dateOfBirth) {
    const newDob = req.body.dateOfBirth.trim();

    // Doctor ki saari vaccines fetch karein taake unka original schedule rule (`vac.date`) mil sake
    const doctorVaccines = await Vaccination.find({ doctorId });
    const vaccineMap = new Map(doctorVaccines.map(v => [v._id.toString(), v.date]));

    // 3. Har vaccine entry ki due date ko naye DOB ke hisaab se update karein
    updatedPatient.patientVaccines = updatedPatient.patientVaccines.map(vaccine => {
      const scheduleIdStr = vaccine.scheduleId ? vaccine.scheduleId.toString() : null;
      const vaccineRule = scheduleIdStr ? vaccineMap.get(scheduleIdStr) : null;

      if (vaccineRule) {
        vaccine.dueDate = calculateDueDate(newDob, vaccineRule);
      }
      return vaccine;
    });

    // 4. Recalculate kiye hue dates ke sath patient record ko save kar dein
    await updatedPatient.save();

    // Updated populated object dobara fetch karein taake client ko complete data mile
    updatedPatient = await Patient.findById(id).populate("patientVaccines.scheduleId");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedPatient, "Patient details and vaccination due dates updated successfully."));
});

// =========================================================================
// 6. DELETE PATIENT RECORD (With Safety & Confirmation Checks)
// =========================================================================
const deletePatient = asyncHandler(async (req, res) => {
  const { id } = req.params; // Patient ID
  const doctorId = req.doctor?._id || req.user?._id;

  if (!doctorId) {
    throw new ApiError(401, "Unauthorized request. Doctor identity missing.");
  }

  // Verify patient exists before deleting
  const patient = await Patient.findOne({ _id: id, doctorId });
  if (!patient) {
    throw new ApiError(404, "Patient not found or unauthorized access.");
  }

  // Delete from DB
  const deletedPatient = await Patient.findByIdAndDelete(id);

  if (!deletedPatient) {
    throw new ApiError(500, "Database Error: Failed to delete patient record.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Patient record deleted successfully."));
});

export {
  addPatient,
  getPatientsByClinic,
  getPatientVaccinationCard,
  updatePatientVaccineStatus,
  updatePatient,
  deletePatient
};