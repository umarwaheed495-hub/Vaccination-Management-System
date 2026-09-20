import { Router } from "express";
import {
  addPatient,
  getPatientsByClinic,
  getPatientVaccinationCard,
  updatePatientVaccineStatus,
  updatePatient,
  getBrandsByVaccineName,
  deletePatient
} from "../controllers/patient.controller.js";
import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";

const router = Router();

// 1. Add Patient (Doctor aur Admin dono add kar sakte hain)
router.route("/add").post(verifyJWT, authorizeRoles("doctor", "admin"), addPatient);

// 2. Get Patients by Clinic
router.route("/clinic/:clinicId").get(verifyJWT, authorizeRoles("doctor", "admin"), getPatientsByClinic);

// 3. Get Patient Vaccination Card (On-demand due date calculation & schedule sync)
router.route("/vaccination-card/:patientId").get(verifyJWT, authorizeRoles("doctor", "admin"), getPatientVaccinationCard);

// 4. Update Patient Vaccine Status & Given Date (New Route added)
router.route("/vaccination-card/:patientId/vaccine/:vaccineId").patch(verifyJWT, authorizeRoles("doctor", "admin"), updatePatientVaccineStatus);

// 5. Get Vaccine Brands by Specific Vaccine Name (NEW ROUTE ADDED)
router.route("/brands-by-name/:vaccineName").get(verifyJWT, authorizeRoles("doctor", "admin"), getBrandsByVaccineName);

// 6. Update Patient Details
router.route("/update/:id").put(verifyJWT, authorizeRoles("doctor", "admin"), updatePatient);

// 7. Delete Patient Record
router.route("/delete/:id").delete(verifyJWT, authorizeRoles("doctor", "admin"), deletePatient);

export default router;