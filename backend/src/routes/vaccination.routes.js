import { Router } from "express";
import {
    getVaccinations,
    addVaccination,
    updateVaccination,
    deleteVaccination
} from "../controllers/vaccination.controller.js";
import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js"; // Path apne project ke mutabiq check kar lijiyega

const router = Router();

// Sabhi routes par pehle authentication check hogi (User logged in hai ya nahi)
router.use(verifyJWT);

// Sirf 'doctor' aur 'admin' roles wale hi in endpoints ko access kar sakenge
router.route("/:doctorId").get(authorizeRoles("doctor", "admin"), getVaccinations);
router.route("/add").post(authorizeRoles("doctor", "admin"), addVaccination);
router.route("/update/:id").put(authorizeRoles("doctor", "admin"), updateVaccination);
router.route("/delete/:id").delete(authorizeRoles("doctor", "admin"), deleteVaccination); // Note: Delete ke liye .delete() hi aayega, neeche theek kar diya hai

export default router;