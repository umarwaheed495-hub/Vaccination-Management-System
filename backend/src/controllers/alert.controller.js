import { Alert } from "../models/alert.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { getDayRange, getTodayString } from "../utils/alertScheduler.js";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

// Bad id (e.g. /alerts/abc) => clear 400 error instead of a 500
const assertValidId = (id) => {
    if (!/^[a-f\d]{24}$/i.test(String(id))) {
        throw new ApiError(400, "Invalid alert id.");
    }
};

const parsePositiveInt = (value, fallback, fieldName) => {
    if (value === undefined) return fallback;

    if (typeof value !== "string" || !/^\d+$/.test(value) || Number(value) < 1) {
        throw new ApiError(400, `"${fieldName}" must be a positive whole number.`);
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

    const page = parsePositiveInt(req.query.page, 1, "page");
    const limit = Math.min(parsePositiveInt(req.query.limit, DEFAULT_LIMIT, "limit"), MAX_LIMIT);

    const [alerts, total, unreadCount] = await Promise.all([
        Alert.find(filter)
            .sort({ dueDate: 1, patientName: 1, _id: 1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        Alert.countDocuments(filter),
        // For the header badge: not tied to the selected date, all unread alerts of this doctor
        Alert.countDocuments({ doctorId, status: "unread" })
    ]);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    alerts,
                    unreadCount,
                    date,
                    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
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
