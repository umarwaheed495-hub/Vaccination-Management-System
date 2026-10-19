import { Alert } from "../models/alert.model.js";
import { Patient } from "../models/patient.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { getDayRange, getTodayString } from "../utils/alertScheduler.js";
import { sendEmail } from "../utils/sendEmail.js";
import { buildAlertEmail } from "../utils/alertEmail.js";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;
const MAX_PAGE = 10000; // keeps "skip" far below what MongoDB accepts; no doctor has this many alerts on one day

// The ONLY place that defines the cooldown between two reminder emails for the same alert
const EMAIL_COOLDOWN_MINUTES = 30;
const EMAIL_COOLDOWN_MS = EMAIL_COOLDOWN_MINUTES * 60 * 1000;

// Only the fields AlertsView shows or uses (smaller response, less data read).
// emailSentAt is only read to work out emailRetryAfterSeconds; it is not sent to the client.
const ALERT_FIELDS = "patientId patientName vaccineName recommendedAge dueDate status emailSentAt";

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

// Seconds left until a new email may be sent for an alert (0 = available now)
const getRetryAfterSeconds = (emailSentAt, nowMs) =>
    emailSentAt ? Math.max(0, Math.ceil((new Date(emailSentAt).getTime() + EMAIL_COOLDOWN_MS - nowMs) / 1000)) : 0;

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
//    Any date works: a past day (overdue), today, or a future day (upcoming - the scheduler creates the alerts ahead of time).
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

    // Attach each patient's phone number and whether an email is saved (read live from the patient record).
    // One query for the whole page, not one per alert. The email address itself is never sent to the client.
    if (alerts.length > 0) {
        const patients = await Patient.find({ _id: { $in: alerts.map((a) => a.patientId) } })
            .select("phone email")
            .lean();
        const contactById = new Map(patients.map((p) => [String(p._id), p]));
        const nowMs = Date.now();

        alerts.forEach((a) => {
            const contact = contactById.get(String(a.patientId));
            a.patientPhone = contact?.phone || "";
            a.hasEmail = Boolean(contact?.email);
            a.emailRetryAfterSeconds = getRetryAfterSeconds(a.emailSentAt, nowMs);
            delete a.emailSentAt;
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

// 3. Send the reminder email - POST /api/v1/alerts/:id/email
//    Nothing comes from the client except the alert id: the recipient is read from the patient record and the
//    subject/body are built here. A cooldown (EMAIL_COOLDOWN_MINUTES) stops the same alert being emailed again.
const sendAlertEmail = asyncHandler(async (req, res) => {
    const { id } = req.params;
    assertValidId(id);
    const doctor = req.doctor;

    // Only the owner of the alert can use it (anyone else gets the same 404 as a missing alert)
    const alert = await Alert.findOne({ _id: id, doctorId: doctor._id })
        .select("patientId patientName vaccineName dueDate")
        .lean();
    if (!alert) {
        throw new ApiError(404, "Alert not found");
    }

    // Recipient is read now, from the patient record. No email => nothing is claimed, no cooldown starts.
    const patient = await Patient.findById(alert.patientId).select("email").lean();
    if (!patient?.email) {
        throw new ApiError(400, "This patient has no email address.");
    }

    // Claim the cooldown in ONE atomic update before sending. Of two simultaneous requests only one matches
    // (emailSentAt is missing or old enough); the other finds the new emailSentAt and is refused.
    const claimedAt = new Date();
    const previous = await Alert.findOneAndUpdate(
        {
            _id: id,
            doctorId: doctor._id,
            $or: [{ emailSentAt: null }, { emailSentAt: { $lte: new Date(claimedAt.getTime() - EMAIL_COOLDOWN_MS) } }]
        },
        { $set: { emailSentAt: claimedAt } },
        { returnDocument: "before", projection: { emailSentAt: 1 } }
    ).lean();

    if (!previous) {
        const current = await Alert.findOne({ _id: id, doctorId: doctor._id }).select("emailSentAt").lean();
        if (!current) {
            throw new ApiError(404, "Alert not found");
        }

        const retryAfterSeconds = Math.max(1, getRetryAfterSeconds(current.emailSentAt, Date.now()));
        return res
            .status(429)
            .set("Retry-After", String(retryAfterSeconds))
            .json(new ApiResponse(429, { retryAfterSeconds }, "An email was already sent for this alert. Please wait before sending another."));
    }

    try {
        const { subject, html } = buildAlertEmail({ ...alert, doctorName: doctor.name });
        await sendEmail({ email: patient.email, subject, message: html });
    } catch (error) {
        // Give the cooldown back so the doctor can retry. Only if it is still the one we set.
        const restore = previous.emailSentAt
            ? { $set: { emailSentAt: previous.emailSentAt } }
            : { $unset: { emailSentAt: "" } };
        await Alert.updateOne({ _id: id, emailSentAt: claimedAt }, restore).catch((restoreError) => {
            console.error("Alert email: could not restore the cooldown:", restoreError?.name);
        });

        // Error codes only: the error message can contain the recipient address
        console.error("Alert email failed:", { alertId: id, code: error?.code, responseCode: error?.responseCode });
        throw new ApiError(502, "Could not send the email. Please try again.");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, { retryAfterSeconds: EMAIL_COOLDOWN_MINUTES * 60 }, "Email sent"));
});

export {
    getAlerts,
    markAsRead,
    sendAlertEmail
};
