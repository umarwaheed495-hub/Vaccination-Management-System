import { Router } from "express";
import {
  createClinic,
  getMyClinics,
  updateClinic,
  deleteClinic,
  toggleClinicStatus,
} from "../controllers/clinic.controller.js";
import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);
router.use(authorizeRoles("doctor", "admin"));

router.route("/create").post(createClinic);
router.route("/my-clinics").get(getMyClinics);

// Status Toggle Route (Single Active Clinic)
router.route("/toggle-status/:clinicId").patch(toggleClinicStatus);

// Update and Delete route
router.route("/:clinicId").patch(updateClinic).delete(deleteClinic);

export default router;