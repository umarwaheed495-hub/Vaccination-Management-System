import { Alert } from "../models/alert.model.js";
import { Patient } from "../models/patient.model.js";
import { Vaccination } from "../models/vaccination.model.js";
import { calculateDueDate } from "./dueDate.js";

// The alert appears the moment the vaccine's DUE DAY starts (12:00 AM in this time zone)
// and stays until the vaccine is given. Pakistan has no daylight saving, so the offset is fixed.
export const ALERT_TIMEZONE = "Asia/Karachi";
const ALERT_TZ_OFFSET = "+05:00";

// Full check of all patients. Cheap now: when nothing changed it only READS, it writes nothing.
const CHECK_INTERVAL_MINUTES = 1;
const BULK_CHUNK_SIZE = 500;

// A pass slower than this is printed in the terminal, so slowness is easy to spot.
const SLOW_PASS_MS = 3000;
// Set ALERT_DEBUG=true in .env to print a one-line summary of every pass.
const DEBUG = process.env.ALERT_DEBUG === "true";

// Only the fields needed to decide "did anything change?"
const ALERT_FIELDS = "_id patientId scheduleId doctorId clinicId patientName vaccineName recommendedAge dueDate";

let isRunning = false;

const dayParts = new Intl.DateTimeFormat("en-US", {
  timeZone: ALERT_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit"
});

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// A moment -> its calendar date as "YYYY-MM-DD" in ALERT_TIMEZONE
const toDayString = (date) => {
  const parts = Object.fromEntries(dayParts.formatToParts(date).map((p) => [p.type, p.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
};

// 12:00 AM (start) of the calendar day the vaccine is due on, in ALERT_TIMEZONE
export const getDueDayStart = (dueDate) =>
  new Date(`${toDayString(dueDate)}T00:00:00${ALERT_TZ_OFFSET}`);

// Today's date as "YYYY-MM-DD" in ALERT_TIMEZONE (the default of the alerts date filter)
export const getTodayString = () => toDayString(new Date());

// "2026-10-14" -> { start, end }: 12:00 AM of that day up to (not including) 12:00 AM of the next day.
// Returns null when the text is not a real calendar date (JavaScript would turn "2026-02-31" into 3 March,
// so the date is converted back and compared).
export const getDayRange = (dateString) => {
  const start = new Date(`${dateString}T00:00:00${ALERT_TZ_OFFSET}`);
  if (isNaN(start.getTime()) || toDayString(start) !== dateString) return null;
  return { start, end: new Date(start.getTime() + ONE_DAY_MS) };
};

// true once the due day has started. Stays true on that whole day AND after it (overdue),
// so a vaccine that is already due or past due shows an alert immediately.
export const isAlertWindowOpen = (dueDate, nowMs = Date.now()) =>
  nowMs >= getDueDayStart(dueDate).getTime();

const text = (v) => String(v ?? "");

// Is the alert already stored in the DB exactly as it should be? Then there is nothing to write.
const isUnchanged = (current, next) =>
  text(current.doctorId) === text(next.doctorId) &&
  text(current.clinicId) === text(next.clinicId) &&
  current.patientName === next.patientName &&
  current.vaccineName === next.vaccineName &&
  text(current.recommendedAge) === text(next.recommendedAge) &&
  current.dueDate instanceof Date &&
  current.dueDate.getTime() === next.dueDate.getTime();

/**
 * Brings the alerts in line with the patients' data.
 *   syncAlerts()                      -> every patient (what the timer runs)
 *   syncAlerts({ patientId })         -> one patient only (used right after a patient is added / edited)
 *   syncAlerts({ doctorId })          -> one doctor's patients
 *
 *  1. Read the existing alerts of this scope once.
 *  2. For every patient + vaccine that is NOT given and whose due day has started (or passed):
 *       - alert missing         -> create it
 *       - alert exists, changed -> update it
 *       - alert exists, same    -> do nothing (no write)
 *  3. Remove alerts that should no longer exist (vaccine given, patient deleted, date changed ...).
 *
 * Never throws, so it is safe to call without await.
 */
export const syncAlerts = async (scope = {}) => {
  const startedAt = Date.now();
  const stats = { patients: 0, written: 0, removed: 0 };

  const patientFilter = scope.patientId
    ? { _id: scope.patientId }
    : scope.doctorId
      ? { doctorId: scope.doctorId }
      : {};
  const alertFilter = scope.patientId
    ? { patientId: scope.patientId }
    : scope.doctorId
      ? { doctorId: scope.doctorId }
      : {};
  const scopeLabel = scope.patientId ? "patient" : scope.doctorId ? "doctor" : "all";

  try {
    const existing = await Alert.find(alertFilter).select(ALERT_FIELDS).lean();
    const existingByKey = new Map(existing.map((a) => [`${a.patientId}:${a.scheduleId}`, a]));

    const scheduleByDoctor = new Map(); // doctorId -> that doctor's vaccination schedule (loaded once per pass)
    const validKeys = new Set(); // "patientId:scheduleId" of every alert that should exist right now
    let ops = [];

    const flush = async () => {
      if (ops.length === 0) return;
      await Alert.bulkWrite(ops, { ordered: false });
      stats.written += ops.length;
      ops = [];
    };

    const cursor = Patient.find(patientFilter)
      .select("patientName dateOfBirth doctorId clinicId patientVaccines.scheduleId patientVaccines.status patientVaccines.dueDate patientVaccines.rescheduled")
      .lean()
      .cursor({ batchSize: 1000 });

    for await (const patient of cursor) {
      stats.patients++;
      const doctorKey = String(patient.doctorId);

      if (!scheduleByDoctor.has(doctorKey)) {
        scheduleByDoctor.set(doctorKey, await Vaccination.find({ doctorId: patient.doctorId }).lean());
      }

      // One pass over the patient's card: which vaccines are given, and which due dates the doctor moved by hand
      const givenIds = new Set();
      const rescheduledDue = new Map(); // scheduleId -> the due date the doctor chose
      for (const pv of patient.patientVaccines || []) {
        if (!pv.scheduleId) continue;
        if (pv.status === "Given") givenIds.add(String(pv.scheduleId));
        else if (pv.rescheduled && pv.dueDate) rescheduledDue.set(String(pv.scheduleId), new Date(pv.dueDate));
      }

      for (const vaccine of scheduleByDoctor.get(doctorKey)) {
        if (givenIds.has(String(vaccine._id))) continue; // already administered -> no alert

        // A rescheduled vaccine keeps the date the doctor chose; every other one follows the date of birth
        const dueDate =
          rescheduledDue.get(String(vaccine._id)) ?? calculateDueDate(patient.dateOfBirth, vaccine.recommendedAge);
        if (!dueDate) continue; // date of birth is not a valid date -> cannot calculate

        if (!isAlertWindowOpen(dueDate, startedAt)) continue; // due day has not started yet

        const key = `${patient._id}:${vaccine._id}`;
        validKeys.add(key);

        const next = {
          doctorId: patient.doctorId,
          clinicId: patient.clinicId,
          patientName: patient.patientName,
          vaccineName: vaccine.name,
          recommendedAge: vaccine.recommendedAge,
          dueDate
        };

        const current = existingByKey.get(key);
        if (current && isUnchanged(current, next)) continue; // already correct -> skip the write

        ops.push({
          updateOne: {
            filter: { patientId: patient._id, scheduleId: vaccine._id },
            update: {
              $set: next,
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

    // Clean-up (only reached if everything above succeeded, so we never delete by mistake)
    const staleIds = existing
      .filter((alert) => !validKeys.has(`${alert.patientId}:${alert.scheduleId}`))
      .map((alert) => alert._id);

    if (staleIds.length > 0) {
      await Alert.deleteMany({ _id: { $in: staleIds } });
      stats.removed = staleIds.length;
    }
  } catch (error) {
    // 11000 = two syncs created the same alert at the same moment; the other one won, which is fine
    if (error?.code !== 11000) console.error("Alert sync failed:", error);
  }

  const ms = Date.now() - startedAt;
  if (DEBUG || ms > SLOW_PASS_MS) {
    console.log(
      `[alerts] ${scopeLabel} sync: ${ms}ms | patients ${stats.patients} | written ${stats.written} | removed ${stats.removed}`
    );
  }

  return { ...stats, ms };
};

// The timer pass: all patients, never two at once
export const generateDueAlerts = async () => {
  if (isRunning) return;
  isRunning = true;
  try {
    await syncAlerts();
  } finally {
    isRunning = false;
  }
};

export const startAlertScheduler = async () => {
  try {
    // Make the alerts indexes match the model exactly: builds the new one, drops old ones nobody uses any more
    await Alert.syncIndexes();
  } catch (error) {
    console.error("Alert index sync failed:", error);
  }

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
