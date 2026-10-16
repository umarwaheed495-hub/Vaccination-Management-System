import { Patient, EMAIL_REGEX } from "../models/patient.model.js";
import { Clinic } from "../models/clinic.model.js";
import { Vaccination } from "../models/vaccination.model.js";
import { VaccineBrand } from "../models/vaccineBrand.model.js";
import { Alert } from "../models/alert.model.js";
import { calculateDueDate } from "../utils/dueDate.js";
import { syncAlerts, getDayRange, getTodayString } from "../utils/alertScheduler.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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
    email,
    clinicId,
  } = req.body;

  // 1. Strict Input Validation (Check for empty fields)
  if (
    [patientName, fatherName, dateOfBirth, fatherCnic, city, phone, email, clinicId].some(
      (field) => !field || field?.toString().trim() === ""
    )
  ) {
    throw new ApiError(400, "Validation Failed: All required fields must be provided.");
  }

  if (!EMAIL_REGEX.test(email.toString().trim())) {
    throw new ApiError(400, "Validation Failed: Please enter a valid email address.");
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
    email: email.toString().trim().toLowerCase(),
    clinicId,
    doctorId,
  });

  // 5. Confirm Data Storage in DB
  if (!newPatient) {
    throw new ApiError(500, "Database Error: Failed to register patient in the database.");
  }

  // Create this patient's due / overdue vaccine alerts now (runs in background, no waiting)
  syncAlerts({ patientId: newPatient._id });

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
// 3. GET PATIENT VACCINATION CARD (Syncs new vaccines with default status)
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

  const doctorVaccines = await Vaccination.find({ doctorId });

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
        dueDate: calculateDueDate(patient.dateOfBirth, vac.recommendedAge),
        givenDate: null,
        status: "Pending", // Default status for new vaccine records
        brandName: "",     // Default brand name
      };
    }
  });

  patient.patientVaccines = updatedPatientVaccines;
  await patient.save({ validateModifiedOnly: true });

  const populatedPatient = await Patient.findById(patientId)
    .populate("patientVaccines.scheduleId")
    .populate("clinicId", "clinicName")
    .populate("doctorId", "name");

  return res
    .status(200)
    .json(new ApiResponse(200, populatedPatient, "Patient vaccination card fetched successfully."));
});

// =========================================================================
// 4. UPDATE PATIENT VACCINE STATUS, BRAND NAME & GIVEN DATE (With Inventory Sync)
// =========================================================================
const updatePatientVaccineStatus = asyncHandler(async (req, res) => {
  const { patientId, vaccineId } = req.params; 
  const { status, brandName, givenDate } = req.body;
  const doctorId = req.doctor?._id || req.user?._id;

  if (!doctorId) {
    throw new ApiError(401, "Unauthorized request. Doctor identity missing.");
  }

  const patient = await Patient.findOne({ _id: patientId, doctorId });
  if (!patient) {
    throw new ApiError(404, "Patient not found or unauthorized access.");
  }

  const vaccineEntry = patient.patientVaccines.find(
    (pv) => pv._id.toString() === vaccineId || (pv.scheduleId && pv.scheduleId.toString() === vaccineId)
  );

  if (!vaccineEntry) {
    throw new ApiError(404, "Vaccine record not found in patient's card.");
  }

  // Purana status aur purana brand save kar lein comparison ke liye
  const oldStatus = vaccineEntry.status;
  const oldBrand = vaccineEntry.brandName ? vaccineEntry.brandName.trim() : "";

  // 1. Status & Automatic Given Date Logic
  if (status !== undefined) {
    vaccineEntry.status = status;

    if (status === "Given") {
      vaccineEntry.givenDate = givenDate ? new Date(givenDate) : new Date();
    } else if (status === "Pending") {
      vaccineEntry.givenDate = null; 
    }
  }

  if (givenDate !== undefined && status !== "Given") {
    vaccineEntry.givenDate = givenDate ? new Date(givenDate) : null;
  }

  // 2. Brand Name Update
  if (brandName !== undefined) {
    vaccineEntry.brandName = brandName.trim();
  }

  const newStatus = vaccineEntry.status;
  const newBrand = vaccineEntry.brandName ? vaccineEntry.brandName.trim() : "";

  // =========================================================================
  // INVENTORY SYNCHRONIZATION LOGIC
  // =========================================================================

  // Scenario 1: Pending se Given hua ho (Stock decrease karein)
  if (oldStatus !== "Given" && newStatus === "Given") {
    if (!newBrand) {
      throw new ApiError(400, "Brand name is required when marking vaccine as Given.");
    }
    const brandDoc = await VaccineBrand.findOne({ doctorId, brandName: newBrand });
    if (!brandDoc) {
      throw new ApiError(404, `Vaccine brand "${newBrand}" not found in inventory.`);
    }
    if (brandDoc.inventory <= 0) {
      throw new ApiError(400, `Out of stock: Vaccine brand "${newBrand}" inventory is 0.`);
    }
    brandDoc.inventory -= 1;
    await brandDoc.save();
  }

  // Scenario 2: Given se wapas Pending kar diya ho (Stock wapas increase karein)
  else if (oldStatus === "Given" && newStatus === "Pending") {
    if (oldBrand) {
      const oldBrandDoc = await VaccineBrand.findOne({ doctorId, brandName: oldBrand });
      if (oldBrandDoc) {
        oldBrandDoc.inventory += 1;
        await oldBrandDoc.save();
      }
    }
  }

  // Scenario 3: Given hi raha lekin brand badal diya (Purane ka +1, Naye ka -1)
  else if (oldStatus === "Given" && newStatus === "Given" && oldBrand !== newBrand) {
    // Purane brand ko stock wapas dein
    if (oldBrand) {
      const oldBrandDoc = await VaccineBrand.findOne({ doctorId, brandName: oldBrand });
      if (oldBrandDoc) {
        oldBrandDoc.inventory += 1;
        await oldBrandDoc.save();
      }
    }

    // Naye brand se stock minus karein
    if (!newBrand) {
      throw new ApiError(400, "Brand name is required when marking vaccine as Given.");
    }
    const newBrandDoc = await VaccineBrand.findOne({ doctorId, brandName: newBrand });
    if (!newBrandDoc) {
      throw new ApiError(404, `Vaccine brand "${newBrand}" not found in inventory.`);
    }
    if (newBrandDoc.inventory <= 0) {
      throw new ApiError(400, `Out of stock: Vaccine brand "${newBrand}" inventory is 0.`);
    }
    newBrandDoc.inventory -= 1;
    await newBrandDoc.save();
  }

  // =========================================================================

  await patient.save({ validateModifiedOnly: true });

  // Vaccine administered -> its alert is no longer needed
  if (newStatus === "Given") {
    await Alert.deleteOne({ patientId: patient._id, scheduleId: vaccineEntry.scheduleId });
  } else if (oldStatus === "Given") {
    // Given -> Pending: the vaccine is due again, bring its alert back (background)
    syncAlerts({ patientId: patient._id });
  }

  await patient.populate("patientVaccines.scheduleId");

  return res
    .status(200)
    .json(new ApiResponse(200, patient, "Vaccine details and inventory updated successfully."));
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

  // Email is mandatory on every update (the edit form always sends it).
  // Without this check, a request that simply leaves "email" out would skip the schema validator.
  const rawEmail = req.body.email;
  if (typeof rawEmail !== "string" || rawEmail.trim() === "") {
    throw new ApiError(400, "Validation Failed: Email is required.");
  }
  if (!EMAIL_REGEX.test(rawEmail.trim())) {
    throw new ApiError(400, "Validation Failed: Please enter a valid email address.");
  }
  req.body.email = rawEmail.trim().toLowerCase();

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
    const vaccineMap = new Map(doctorVaccines.map(vac => [vac._id.toString(), vac.recommendedAge]));

    // 3. Har vaccine entry ki due date ko naye DOB ke hisaab se update karein
    updatedPatient.patientVaccines = updatedPatient.patientVaccines.map(vaccine => {
      const scheduleIdStr = vaccine.scheduleId ? vaccine.scheduleId.toString() : null;
      const vaccineRule = scheduleIdStr ? vaccineMap.get(scheduleIdStr) : null;

      // A due date the doctor moved by hand (Reschedule) is kept; only calculated dates follow the new birth date
      if (vaccineRule && !vaccine.rescheduled) {
        vaccine.dueDate = calculateDueDate(newDob, vaccineRule);
      }
      return vaccine;
    });

    // 4. Recalculate kiye hue dates ke sath patient record ko save kar dein
    await updatedPatient.save({ validateModifiedOnly: true });

    // Updated populated object dobara fetch karein taake client ko complete data mile
    updatedPatient = await Patient.findById(id).populate("patientVaccines.scheduleId");
  }

  // Name or date of birth may have changed -> refresh this patient's alerts (background)
  syncAlerts({ patientId: id });

  return res
    .status(200)
    .json(new ApiResponse(200, updatedPatient, "Patient details and vaccination due dates updated successfully."));
});

// =========================================================================
// GET VACCINE BRANDS BY SPECIFIC VACCINE NAME
// =========================================================================
const getBrandsByVaccineName = asyncHandler(async (req, res) => {
  const { vaccineName } = req.params; // URL se vaccine name aayega (jaise "Tdap" ya "OPV-I")
  const doctorId = req.doctor?._id || req.user?._id;

  // 1. Unauthorized Check
  if (!doctorId) {
    throw new ApiError(401, "Unauthorized request. Doctor identity missing.");
  }

  // 2. Strict Input Validation
  if (!vaccineName || vaccineName.toString().trim() === "") {
    throw new ApiError(400, "Validation Failed: Vaccine name parameter is required.");
  }


  // Helper to escape special regex characters (brackets like ( ) etc.)
  const escapedName = vaccineName.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');


  // 3. Fetch Brands from DB (Case-insensitive exact match for logged-in doctor)
  const brands = await VaccineBrand.find({
    doctorId,
    vaccineName: { $regex: new RegExp(`^${escapedName}$`, "i") },
  });

  // 4. Send Response
  return res
    .status(200)
    .json(new ApiResponse(200, brands, "Vaccine brands fetched successfully by name."));
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

  // Patient is gone -> remove their vaccine alerts too
  await Alert.deleteMany({ patientId: id });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Patient record deleted successfully."));
});

// =========================================================================
// RESCHEDULE - move the recommended due date of one vaccine, or of a whole due-date group
// =========================================================================
const MAX_RESCHEDULE_VACCINES = 100;
const isObjectId = (value) => typeof value === "string" && /^[a-f\d]{24}$/i.test(value);

// "2026-10-20" -> the Date that is stored. Rejects text that is not a real calendar date and dates in the past
// (compared as calendar days in the clinic's time zone). Noon UTC is stored so the day looks the same in every time zone.
const parseRescheduleDate = (value) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value) || !getDayRange(value)) {
    throw new ApiError(400, "A valid due date (YYYY-MM-DD) is required.");
  }
  if (value < getTodayString()) {
    throw new ApiError(400, "The new due date cannot be in the past.");
  }
  return new Date(`${value}T12:00:00.000Z`);
};

// Shared by both reschedule endpoints. Only "Pending" vaccines move: given vaccines are skipped, and the
// status is checked again inside the update itself, so a vaccine given a moment ago can never be moved.
const rescheduleVaccines = async ({ patientId, doctorId, vaccineIds, dueDate }) => {
  if (!doctorId) {
    throw new ApiError(401, "Unauthorized request. Doctor identity missing.");
  }
  if (!isObjectId(patientId) || !vaccineIds.every(isObjectId)) {
    throw new ApiError(400, "Invalid patient or vaccine id.");
  }
  const newDueDate = parseRescheduleDate(dueDate);

  const patient = await Patient.findOne({ _id: patientId, doctorId }).select("patientVaccines").lean();
  if (!patient) {
    throw new ApiError(404, "Patient not found or unauthorized access.");
  }

  // A vaccine can be named by its card-entry id or by its schedule id (same as the status update route)
  const entryByRef = new Map();
  patient.patientVaccines.forEach((entry) => {
    entryByRef.set(String(entry._id), entry);
    if (entry.scheduleId) entryByRef.set(String(entry.scheduleId), entry);
  });

  const entries = new Map(); // one entry per vaccine, even if it was named twice
  for (const ref of vaccineIds) {
    const entry = entryByRef.get(ref);
    if (!entry) {
      throw new ApiError(404, "Vaccine record not found in patient's card.");
    }
    entries.set(String(entry._id), entry);
  }

  const pending = [...entries.values()].filter((entry) => entry.status === "Pending");
  if (pending.length === 0) {
    throw new ApiError(400, "Given vaccines cannot be rescheduled. Mark the vaccine as Pending first.");
  }

  await Patient.updateOne(
    { _id: patient._id, doctorId },
    { $set: { "patientVaccines.$[v].dueDate": newDueDate, "patientVaccines.$[v].rescheduled": true } },
    { arrayFilters: [{ "v._id": { $in: pending.map((entry) => entry._id) }, "v.status": "Pending" }] }
  );

  // The alerts follow the new dates (background): a vaccine moved to the future loses its alert, one moved to today gets it
  syncAlerts({ patientId: patient._id });

  // Same shape as the vaccination card endpoint, so the page can replace its data with this response
  const updatedPatient = await Patient.findById(patient._id)
    .populate("patientVaccines.scheduleId")
    .populate("clinicId", "clinicName")
    .populate("doctorId", "name");

  return { updatedPatient, moved: pending.length, skipped: entries.size - pending.length };
};

// PATCH /vaccination-card/:patientId/vaccine/:vaccineId/reschedule   body: { dueDate: "YYYY-MM-DD" }
const rescheduleVaccine = asyncHandler(async (req, res) => {
  const { patientId, vaccineId } = req.params;

  const { updatedPatient } = await rescheduleVaccines({
    patientId,
    doctorId: req.doctor?._id || req.user?._id,
    vaccineIds: [vaccineId],
    dueDate: req.body?.dueDate,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, updatedPatient, "Vaccine rescheduled successfully."));
});

// PATCH /vaccination-card/:patientId/reschedule   body: { vaccineIds: [...], dueDate: "YYYY-MM-DD" }
const rescheduleVaccineGroup = asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const { vaccineIds, dueDate } = req.body ?? {};

  if (!Array.isArray(vaccineIds) || vaccineIds.length === 0 || vaccineIds.length > MAX_RESCHEDULE_VACCINES) {
    throw new ApiError(400, `Send between 1 and ${MAX_RESCHEDULE_VACCINES} vaccine ids.`);
  }

  const { updatedPatient, moved, skipped } = await rescheduleVaccines({
    patientId,
    doctorId: req.doctor?._id || req.user?._id,
    vaccineIds,
    dueDate,
  });

  const message =
    `${moved} vaccine${moved === 1 ? "" : "s"} rescheduled successfully.` +
    (skipped > 0 ? ` ${skipped} already given ${skipped === 1 ? "was" : "were"} left unchanged.` : "");

  return res.status(200).json(new ApiResponse(200, updatedPatient, message));
});

export {
  addPatient,
  getPatientsByClinic,
  getPatientVaccinationCard,
  updatePatientVaccineStatus,
  rescheduleVaccine,
  rescheduleVaccineGroup,
  updatePatient,
  getBrandsByVaccineName,
  deletePatient
};