import { Alert, ALERT_STATUSES } from "../models/alert.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;
const SORT_ORDERS = ["asc", "desc"];

// Bad id (e.g. /alerts/abc) => clear 400 error instead of a 500
const assertValidId = (id) => {
    if (!/^[a-f\d]{24}$/i.test(String(id))) {
        throw new ApiError(400, "Invalid alert id.");
    }
};

// Query value check: not given => undefined, invalid => 400
const parseEnum = (value, allowed, fieldName) => {
    if (value === undefined || value === "") return undefined;

    if (typeof value !== "string" || !allowed.includes(value)) {
        throw new ApiError(400, `Invalid ${fieldName}. Allowed values: ${allowed.join(", ")}.`);
    }
    return value;
};

const parsePositiveInt = (value, fallback, fieldName) => {
    if (value === undefined) return fallback;

    if (typeof value !== "string" || !/^\d+$/.test(value) || Number(value) < 1) {
        throw new ApiError(400, `"${fieldName}" must be a positive whole number.`);
    }
    return Number(value);
};

// 1. Get alerts (sorted by vaccine due date + pagination) - GET /api/v1/alerts
//    Optional query: ?status=unread&sort=asc&page=1&limit=50
//    sort=asc  -> earliest due date first (overdue vaccines on top)  [default]
//    sort=desc -> latest due date first
//    Alerts are created automatically by utils/alertScheduler.js
const getAlerts = asyncHandler(async (req, res) => {
    const doctorId = req.doctor._id;

    const filter = { doctorId };

    const status = parseEnum(req.query.status, ALERT_STATUSES, "status");
    const sort = parseEnum(req.query.sort, SORT_ORDERS, "sort") || "asc";

    if (status) filter.status = status;

    const page = parsePositiveInt(req.query.page, 1, "page");
    const limit = Math.min(parsePositiveInt(req.query.limit, DEFAULT_LIMIT, "limit"), MAX_LIMIT);

    const [alerts, total, unreadCount] = await Promise.all([
        Alert.find(filter)
            .sort({ dueDate: sort === "desc" ? -1 : 1, _id: 1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        Alert.countDocuments(filter),
        // For the header badge: independent of filters, all unread alerts of this doctor
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
