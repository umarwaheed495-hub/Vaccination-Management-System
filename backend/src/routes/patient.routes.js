import { Router } from "express";
import {
  addPatient,
  getPatientsByClinic,
  getPatientVaccinationCard,
  getVaccinationBill,
  updatePatientVaccineStatus,
  rescheduleVaccine,
  rescheduleVaccineGroup,
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

// 3a. Bill for a group of vaccines (clinic fee is added only if at least one is "Given")
router.route("/vaccination-card/:patientId/bill").get(verifyJWT, authorizeRoles("doctor", "admin"), getVaccinationBill);

// 4. Update Patient Vaccine Status & Given Date (New Route added)
router.route("/vaccination-card/:patientId/vaccine/:vaccineId").patch(verifyJWT, authorizeRoles("doctor", "admin"), updatePatientVaccineStatus);

// 4a. Reschedule ONE vaccine's due date
router.route("/vaccination-card/:patientId/vaccine/:vaccineId/reschedule").patch(verifyJWT, authorizeRoles("doctor", "admin"), rescheduleVaccine);

// 4b. Reschedule a whole due-date group (body: { vaccineIds: [...], dueDate })
router.route("/vaccination-card/:patientId/reschedule").patch(verifyJWT, authorizeRoles("doctor", "admin"), rescheduleVaccineGroup);

// 5. Get Vaccine Brands by Specific Vaccine Name (NEW ROUTE ADDED)
router.route("/brands-by-name/:vaccineName").get(verifyJWT, authorizeRoles("doctor", "admin"), getBrandsByVaccineName);

// 6. Update Patient Details
router.route("/update/:id").put(verifyJWT, authorizeRoles("doctor", "admin"), updatePatient);

// 7. Delete Patient Record
router.route("/delete/:id").delete(verifyJWT, authorizeRoles("doctor", "admin"), deletePatient);

export default router;