import { Alert } from "../models/alert.model.js";
import { Patient } from "../models/patient.model.js";
import { Vaccination } from "../models/vaccination.model.js";
import { calculateDueDate } from "./dueDate.js";

// An alert appears this many hours BEFORE the vaccine's due date ...
export const ALERT_LEAD_HOURS = 12;
// ... and the scheduler checks this often, so an alert shows up within about a minute of the exact moment.
const CHECK_INTERVAL_MINUTES = 1;
const BULK_CHUNK_SIZE = 500;

const HOUR_MS = 60 * 60 * 1000;

let isRunning = false;

// true once "now" has reached (due date - 12 hours). Stays true after the due date, too (overdue).
export const isAlertWindowOpen = (dueDate, nowMs = Date.now()) =>
  nowMs >= dueDate.getTime() - ALERT_LEAD_HOURS * HOUR_MS;

/**
 * One scheduler pass:
 *  1. For every patient, work out each vaccine's due date (from DOB + doctor's schedule).
 *  2. If the vaccine is NOT given yet and the 12-hour window is open, create the alert (or refresh it).
 *  3. Remove alerts that should no longer exist (vaccine given, patient deleted, schedule changed ...).
 */
export const generateDueAlerts = async () => {
  if (isRunning) return; // never run two passes at once
  isRunning = true;

  try {
    const nowMs = Date.now();
    const scheduleByDoctor = new Map(); // doctorId -> that doctor's vaccination schedule (loaded once per pass)
    const validKeys = new Set(); // "patientId:scheduleId" of every alert that should exist right now
    let ops = [];

    const flush = async () => {
      if (ops.length === 0) return;
      await Alert.bulkWrite(ops, { ordered: false });
      ops = [];
    };

    const cursor = Patient.find({})
      .select("patientName dateOfBirth doctorId clinicId patientVaccines.scheduleId patientVaccines.status")
      .lean()
      .cursor();

    for await (const patient of cursor) {
      const doctorKey = String(patient.doctorId);

      if (!scheduleByDoctor.has(doctorKey)) {
        scheduleByDoctor.set(doctorKey, await Vaccination.find({ doctorId: patient.doctorId }).lean());
      }

      const givenIds = new Set(
        (patient.patientVaccines || [])
          .filter((pv) => pv.status === "Given" && pv.scheduleId)
          .map((pv) => String(pv.scheduleId))
      );

      for (const vaccine of scheduleByDoctor.get(doctorKey)) {
        if (givenIds.has(String(vaccine._id))) continue; // already administered -> no alert

        const dueDate = calculateDueDate(patient.dateOfBirth, vaccine.recommendedAge);
        if (!dueDate) continue; // date of birth is not a valid date -> cannot calculate

        if (!isAlertWindowOpen(dueDate, nowMs)) continue; // more than 12 hours away

        validKeys.add(`${patient._id}:${vaccine._id}`);

        ops.push({
          updateOne: {
            filter: { patientId: patient._id, scheduleId: vaccine._id },
            update: {
              $set: {
                doctorId: patient.doctorId,
                clinicId: patient.clinicId,
                patientName: patient.patientName,
                vaccineName: vaccine.name,
                recommendedAge: vaccine.recommendedAge,
                dueDate
              },
              // an alert the doctor already marked as read stays "read"
              $setOnInsert: { status: "unread" }
            },
            upsert: true
          }
        });

        if (ops.length >= BULK_CHUNK_SIZE) await flush();
      }
    }

    await flush();

    // Clean-up (only reached if the whole pass above succeeded, so we never delete by mistake)
    const existing = await Alert.find({}).select("_id patientId scheduleId").lean();
    const staleIds = existing
      .filter((alert) => !validKeys.has(`${alert.patientId}:${alert.scheduleId}`))
      .map((alert) => alert._id);

    if (staleIds.length > 0) {
      await Alert.deleteMany({ _id: { $in: staleIds } });
    }
  } catch (error) {
    console.error("Alert generation failed:", error);
  } finally {
    isRunning = false;
  }
};

export const startAlertScheduler = async () => {
  try {
    // One-time clean-up of old manual alerts (they have no patient and are not used any more)
    await Alert.deleteMany({ patientId: { $exists: false } });
  } catch (error) {
    console.error("Old alert clean-up failed:", error);
  }

  // Run once at start-up (catches anything missed while the server was off), then on a timer
  await generateDueAlerts();
  setInterval(generateDueAlerts, CHECK_INTERVAL_MINUTES * 60 * 1000);

};
