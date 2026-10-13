import { Router } from "express";
import {
    getAlerts,
    markAsRead
} from "../controllers/alert.controller.js";
import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";

const router = Router();

// Authentication check on every route first
router.use(verifyJWT);

// Alerts are created automatically by the scheduler (utils/alertScheduler.js),
// so there is no create / delete route. Only 'doctor' and 'admin' roles can access these endpoints.
router.route("/").get(authorizeRoles("doctor", "admin"), getAlerts);                // GET    /api/v1/alerts
router.route("/:id/read").patch(authorizeRoles("doctor", "admin"), markAsRead);     // PATCH  /api/v1/alerts/:id/read

export default router;
