import { Alert } from "../models/alert.model.js";
import { Patient } from "../models/patient.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { getDayRange, getTodayString } from "../utils/alertScheduler.js";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;
const MAX_PAGE = 10000; // keeps "skip" far below what MongoDB accepts; no doctor has this many alerts on one day

// Only the fields AlertsView shows or uses (patientPhone and patientEmail are added in getAlerts from the Patient record) (smaller response, less data read)
const ALERT_FIELDS = "patientId patientName vaccineName recommendedAge dueDate status";

// Bad id (e.g. /alerts/abc) => clear 400 error instead of a 500
const assertValidId = (id) => {
    if (!/^[a-f\d]{24}$/i.test(String(id))) {
        throw new ApiError(400, "Invalid alert id.");
    }
};

const parsePositiveInt = (value, fallback, fieldName, max) => {
    if (value === undefined) return fallback;

    if (typeof value !== "string" || !/^\d+$/.test(value) || Number(value) < 1) {
        throw new ApiError(400, `"${fieldName}" must be a positive whole number.`);
    }
    if (max !== undefined && Number(value) > max) {
        throw new ApiError(400, `"${fieldName}" cannot be greater than ${max}.`);
    }
    return Number(value);
};

// ?date=YYYY-MM-DD. Not given => today's date (Pakistan time, same time zone the alerts use).
const parseDate = (value) => {
    if (value === undefined || value === "") return getTodayString();

    if (typeof value !== "string" || !getDayRange(value)) {
        throw new ApiError(400, "Invalid date. Use the format YYYY-MM-DD (for example 2026-10-14).");
    }
    return value;
};

// 1. Get alerts of ONE date - GET /api/v1/alerts
//    Optional query: ?date=2026-10-14&page=1&limit=50
//    Only alerts whose vaccine is due on that date are returned. Without ?date= it is today.
//    There are no status / sort options: the order is fixed (due date, then patient name).
//    Alerts are created automatically by utils/alertScheduler.js
const getAlerts = asyncHandler(async (req, res) => {
    const doctorId = req.doctor._id;

    const date = parseDate(req.query.date);
    const { start, end } = getDayRange(date);

    const filter = { doctorId, dueDate: { $gte: start, $lt: end } };

    const page = parsePositiveInt(req.query.page, 1, "page", MAX_PAGE);
    const limit = Math.min(parsePositiveInt(req.query.limit, DEFAULT_LIMIT, "limit"), MAX_LIMIT);

    const alerts = await Alert.find(filter)
        .select(ALERT_FIELDS)
        .sort({ dueDate: 1, patientName: 1, _id: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

    // Attach each patient's registered phone number and email (read live from the patient record, so edits to the
    // number show up immediately). One query for the whole page, not one per alert.
    if (alerts.length > 0) {
        const patients = await Patient.find({ _id: { $in: alerts.map((a) => a.patientId) } })
            .select("phone email")
            .lean();
        const contactById = new Map(patients.map((p) => [String(p._id), p]));
        alerts.forEach((a) => {
            const contact = contactById.get(String(a.patientId));
            a.patientPhone = contact?.phone || "";
            a.patientEmail = contact?.email || "";
        });
    }

    // A page that is not full already tells us the total, so the count query is skipped in the usual case
    // (a day with fewer alerts than "limit"). It only runs for a full page, or for an empty page after page 1.
    const isShortPage = alerts.length < limit && (page === 1 || alerts.length > 0);
    const total = isShortPage ? (page - 1) * limit + alerts.length : await Alert.countDocuments(filter);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    alerts,
                    date,
                    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) }
                },
                "Alerts fetched successfully"
            )
        );
});

// 2. Mark an alert as read - PATCH /api/v1/alerts/:id/read
//    The alert stays in the list until the vaccine is marked as Given.
const markAsRead = asyncHandler(async (req, res) => {
    const { id } = req.params;
    assertValidId(id);

    const updatedAlert = await Alert.findOneAndUpdate(
        { _id: id, doctorId: req.doctor._id },
        { $set: { status: "read" } },
        { returnDocument: "after" }
    );

    if (!updatedAlert) {
        throw new ApiError(404, "Alert not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, updatedAlert, "Alert marked as read"));
});

export {
    getAlerts,
    markAsRead
};
