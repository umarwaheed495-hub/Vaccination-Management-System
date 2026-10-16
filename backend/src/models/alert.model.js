import mongoose from "mongoose";

// Alerts are created automatically (see utils/alertScheduler.js).
// One alert = one patient + one vaccine that is due (or overdue) and not yet given.
export const ALERT_STATUSES = ["unread", "read"];

const alertSchema = new mongoose.Schema(
    {
        // Doctor who owns the patient (each doctor only sees their own alerts)
        doctorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Doctor",
            required: true
        },
        patientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Patient",
            required: true
        },
        clinicId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Clinic"
        },
        // Vaccination (schedule item) this alert is about
        scheduleId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Vaccination",
            required: true
        },

        // Snapshot fields so the alert list needs no populate. The scheduler refreshes them on every run.
        patientName: {
            type: String,
            required: true,
            trim: true
        },
        vaccineName: {
            type: String,
            required: true,
            trim: true
        },
        recommendedAge: {
            type: String,
            trim: true
        },

        // Vaccine due date calculated from the patient's date of birth.
        // The alert is created when this day starts (12:00 AM) and stays until the vaccine is given.
        dueDate: {
            type: Date,
            required: true
        },

        // "read" only changes how the alert looks. The alert stays until the vaccine is given.
        status: {
            type: String,
            enum: {
                values: ALERT_STATUSES,
                message: "Status must be either unread or read"
            },
            default: "unread"
        },

        // When the reminder email was last sent. Used for the cooldown (see EMAIL_COOLDOWN_MINUTES in the alert controller).
        emailSentAt: {
            type: Date
        }
    },
    {
        timestamps: true
    }
);

// The alerts list: one doctor + one day (range on dueDate), ordered by dueDate, patientName, _id.
// The index has exactly that order, so MongoDB returns the page already sorted (no in-memory sort).
alertSchema.index({ doctorId: 1, dueDate: 1, patientName: 1, _id: 1 });

// One alert per patient per vaccine. This stops the scheduler from creating duplicates.
// Partial, so any old-format documents (no patientId) cannot break index creation.
alertSchema.index(
    { patientId: 1, scheduleId: 1 },
    { unique: true, partialFilterExpression: { patientId: { $exists: true } } }
);

export const Alert = mongoose.model("Alert", alertSchema);
