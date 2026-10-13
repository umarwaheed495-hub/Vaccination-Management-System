// Patient DOB + vaccine recommended age (e.g. "Birth", "6 weeks", "9 months", "4–5 years") => due Date.
// Shared by the vaccination card (patient.controller.js) and the alert scheduler,
// so an alert always uses exactly the same due date the card shows.
export const calculateDueDate = (dob, scheduleStr) => {
  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) return null;

  const str = scheduleStr ? scheduleStr.toLowerCase().trim() : "";

  if (str === "birth" || str === "at birth" || str === "0") {
    return birthDate;
  }

  const num = parseInt(str);
  if (isNaN(num)) return birthDate;

  const dueDate = new Date(birthDate);

  if (str.includes("week")) {
    dueDate.setDate(dueDate.getDate() + (num * 7));
  } else if (str.includes("month")) {
    dueDate.setMonth(dueDate.getMonth() + num);
  } else if (str.includes("year")) {
    dueDate.setFullYear(dueDate.getFullYear() + num);
  }

  return dueDate;
};
