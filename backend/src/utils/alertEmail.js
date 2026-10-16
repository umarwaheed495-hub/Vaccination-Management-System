import { ALERT_TIMEZONE } from "./alertScheduler.js";

const HTML_ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

// Every dynamic value that goes into the HTML must pass through here
const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);

const dueDateFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: ALERT_TIMEZONE,
  day: "numeric",
  month: "long",
  year: "numeric",
});

// Subject + HTML body of the vaccine reminder email. Built only from data the server already has,
// with the same wording as the WhatsApp reminder shown on the alert card.
export const buildAlertEmail = ({ patientName, vaccineName, dueDate, doctorName }) => {
  const patient = escapeHtml(patientName);
  const vaccine = escapeHtml(vaccineName);

  return {
    // Line breaks are removed so a name can never add extra email headers
    subject: `Vaccine due: ${vaccineName} for ${patientName}`.replace(/\s+/g, " "),
    html: `
<div style="font-family: Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #1f2937;">
  <p>Assalam o Alaikum!</p>
  <p>
    This is a reminder from your doctor's clinic that the <strong>${vaccine}</strong> vaccine
    for <strong>${patient}</strong> is due on <strong>${escapeHtml(dueDateFormat.format(dueDate))}</strong>.
    Please visit the clinic at your earliest convenience to get the vaccine.
  </p>
  <p>Thank you.<br>${escapeHtml(doctorName)}</p>
</div>`,
  };
};
